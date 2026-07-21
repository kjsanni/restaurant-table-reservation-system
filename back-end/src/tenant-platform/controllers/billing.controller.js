const crypto = require("crypto");
const { verifyWebhookSignature } = require("../services/paystack.service");
const { syncFromPaymentGateway } = require("../services/tenantSubscription.service");
const orderDAO = require("../../DAOs/order.dao");
const paymentDAO = require("../../DAOs/payment.dao");
const deliveryService = require("../../services/delivery.service");
const whatsappService = require("../../services/whatsapp.service");
const messageTemplates = require("../../services/messageTemplates.service");
const db = require("../../db/models");

const webhookHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = JSON.stringify(req.body);

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const eventId = req.body.id;
  const event = req.body.event;
  const data = req.body.data;

  if (eventId) {
    const existingEvent = await db.paystackEvent.findOne({
      where: { paystackEventId: String(eventId) },
    });
    if (existingEvent) {
      return res.status(200).json({ success: true, message: "Event already processed" });
    }
  }

  try {
    const resolvedTenantId = await resolveTenantFromWebhook(data);
    switch (event) {
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "subscription.cancelled":
        if (resolvedTenantId) {
          await syncFromPaymentGateway(resolvedTenantId, {
            event,
            nextBillingDate: data.next_payment_date,
            graceDays: 7,
          });
        }
        break;
      case "charge.success":
        if (resolvedTenantId) {
          const tenant = await db.tenant.findByPk(resolvedTenantId);
          if (tenant) {
            await tenant.update({
              lastPaymentAt: new Date(),
              subscriptionStatus: "active",
              status: "active",
              graceEndsAt: null,
            });
          }

          const metadata = data?.metadata || {};
          const orderId = metadata.orderId;
          if (orderId) {
            const order = await orderDAO.getOrderById(orderId, resolvedTenantId);
            if (order) {
              const paidAmount = parseFloat(data.amount || 0) / 100;
              await paymentDAO.create({
                orderId: order.id,
                amount: paidAmount,
                method: "card",
                paidBy: data.customer?.email || null,
                reference: data.reference || data.id,
              }, resolvedTenantId);

              const payments = await paymentDAO.getOrderPayments(order.id, resolvedTenantId);
              const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
              const orderTotal = parseFloat(order.total || 0);
              const discountAmount = parseFloat(metadata.discountAmount || 0);
              const effectiveTotal = orderTotal - discountAmount;
              const paymentStatus = totalPaid >= effectiveTotal ? "paid" : totalPaid > 0 ? "partial" : "unpaid";
              if (order.paymentStatus !== paymentStatus) {
                await orderDAO.updateOrder(order.id, resolvedTenantId, { paymentStatus });
              }

              if (paymentStatus === "paid" && metadata.deliveryLocation) {
                try {
                  const customerPhone = metadata.customerPhone || order.customer?.phone;
                  const customerName = order.customer
                    ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
                    : "WhatsApp Customer";
                  const delivery = await deliveryService.createFromWhatsApp(
                    resolvedTenantId,
                    order.id,
                    metadata.deliveryLocation,
                    customerName,
                    customerPhone
                  );
                  if (delivery && delivery.trackingNumber && customerPhone) {
                    const trackingMsg = await messageTemplates.render(
                      "delivery_tracking",
                      { trackingNumber: delivery.trackingNumber },
                      resolvedTenantId
                    );
                    await whatsappService.sendWhatsAppText(
                      customerPhone,
                      trackingMsg,
                      resolvedTenantId
                    );
                  }
                } catch (deliveryErr) {
                  console.error("Failed to create WhatsApp delivery after payment:", deliveryErr.message);
                }
              }
            }
          }
        }
        break;
      default:
        break;
    }

    if (eventId) {
      await db.paystackEvent.create({
        paystackEventId: String(eventId),
        tenantId: resolvedTenantId,
        event,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

// Resolve tenant from webhook data WITHOUT trusting metadata.tenantId alone.
// Prefer Paystack's own identifiers (customer_code / authorization) so a
// forged payload with a guessed metadata.tenantId cannot target another tenant.
const resolveTenantFromWebhook = async (data) => {
  const customerCode = data?.customer?.customer_code;
  const authorization = data?.authorization;
  const metadataTenantId = data?.metadata?.tenantId;

  if (customerCode) {
    const byCustomer = await db.tenant.findOne({
      where: { paystackCustomerCode: customerCode },
    });
    if (byCustomer) return byCustomer.id;
  }

  if (authorization) {
    const byAuth = await db.tenant.findOne({
      where: { paystackAuthorization: authorization },
    });
    if (byAuth) return byAuth.id;
  }

  if (metadataTenantId) {
    const byMeta = await db.tenant.findByPk(metadataTenantId);
    if (byMeta) return metadataTenantId;
  }

  return null;
};

const testWebhookHandler = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhook endpoint is reachable",
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  webhookHandler,
  testWebhookHandler,
};
