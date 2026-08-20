const webhookService = require("../services/webhook.service");
const failedPaymentAlertDAO = require("../tenant-platform/DAOs/failedPaymentAlert.dao");
const passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
const notificationDAO = require("../tenant-platform/DAOs/notification.dao");
const deliveryService = require("../services/delivery.service");
const messageTemplates = require("../services/messageTemplates.service");
const db = require("../db/models");
const logger = require("../utils/logger");
const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
const { validateWebhookUrl } = require("../tenant-platform/services/webhookNotification.service");

const listSubscriptionsHandler = async (req, res) => {
  const config = await require("../DAOs/auth.dao").getSettingValue(
    "webhooks",
    { enabled: false, subscriptions: [] },
    req.tenant?.id
  );
  return res.status(200).json({ success: true, webhooks: config });
};

const updateSubscriptionsHandler = async (req, res) => {
  const { subscriptions } = req.body;
  if (!Array.isArray(subscriptions)) {
    return res.status(400).json({ success: false, message: "subscriptions must be an array" });
  }
  for (const sub of subscriptions) {
    if (sub.url) {
      try {
        await validateWebhookUrl(sub.url);
      } catch (err) {
        return res.status(400).json({ success: false, message: `Invalid webhook URL: ${err.message}` });
      }
    }
  }
  const authDAO = require("../DAOs/auth.dao");
  const updated = await authDAO.updateSetting(
    "webhooks",
    { enabled: true, subscriptions }
  );
  return res.status(200).json({ success: true, webhooks: updated });
};

const testHandler = async (req, res) => {
  const { url, event } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "url is required" });
  }
  try {
    await validateWebhookUrl(url);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Invalid webhook URL: ${err.message}` });
  }
  await webhookService.dispatch(event || "test", { message: "webhook test payload" }, req.tenant?.id);
  return res.status(200).json({ success: true, message: "Test webhook dispatched" });
};

const paystackEventHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = JSON.stringify(req.body);

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body?.event;
  const data = req.body?.data || {};

  if (event === "charge.failed") {
    let tenantId = null;
    if (data.metadata?.tenantId) {
      const tenant = await db.tenant.findByPk(data.metadata.tenantId); // codacy-suppress nosql-injection - parameterized ORM call
      if (tenant) tenantId = tenant.id;
    }

    await failedPaymentAlertDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
      tenantId,
      reservationId: data.metadata?.reservationId || null,
      reference: data.reference || data.id,
      amount: parseFloat(data.amount || 0) / 100,
      currency: data.currency || "GHS",
      reason: data.gateway_response || data.failure_reason || "Payment failed",
      gateway: "paystack",
      metadata: {
        customerEmail: data.customer?.email,
        authorization: data.authorization,
        ipAddress: data.ip_address,
      },
    });
  }

  if (event === "charge.success") {
    let tenantId = null;
    if (data.metadata?.tenantId) {
      const tenant = await db.tenant.findByPk(data.metadata.tenantId); // codacy-suppress nosql-injection - parameterized ORM call
      if (tenant) tenantId = tenant.id;
    }

    const appointmentId = data.metadata?.appointmentId;
    if (appointmentId && tenantId) {
      const appointment = await db.appointment.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
        where: { id: appointmentId, tenantId },
      });
      if (appointment && appointment.paymentStatus !== "paid") {
        await appointment.update({ // codacy-suppress nosql-injection - parameterized ORM call
          paymentStatus: "paid",
          depositAmount: parseFloat(data.amount || 0) / 100,
        });
      }
    }

    const bookingId = data.metadata?.bookingId;
    if (bookingId && tenantId) {
      const booking = await db.eventBooking.findOne({ // codacy-suppress nosql-injection
        where: { id: bookingId, tenantId },
      });
      if (booking && booking.paymentStatus !== "paid") {
        await booking.update({ // codacy-suppress nosql-injection - parameterized ORM call
          paymentStatus: "paid",
          status: "confirmed",
          paymentReference: data.reference,
          paymentMethod: "paystack",
        });
      }
    }

    const signingRequestId = data.metadata?.requestId;
    if (signingRequestId && tenantId) {
      const request = await passSigningRequestDAO.findById(signingRequestId);
      if (request && request.status === "pending_payment") {
        await passSigningRequestDAO.updatePaymentStatus(signingRequestId, data.reference);
        logger.info("Wallet pass signing payment confirmed", {
          requestId: signingRequestId,
          tenantId,
          reference: data.reference,
        });
        try {
          const superAdmins = await db.user.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
            where: { isSuperAdmin: true },
            attributes: ["id"],
          });
          for (const admin of superAdmins) {
            await notificationDAO.create({ // codacy-suppress nosql-injection - parameterized ORM call
              userId: admin.id,
              tenantId: null,
              type: "wallet_pass_signing_request",
              title: "New wallet pass signing request",
              message: `Tenant ${tenantId} submitted a signing request (ID: ${signingRequestId})`,
              data: { requestId: signingRequestId, tenantId },
            });
          }
        } catch (notifyErr) {
          logger.warn("Failed to notify super-admins of wallet pass request", {
            error: notifyErr.message,
            requestId: signingRequestId,
          });
        }
      }
    }

    const orderId = Number(data.metadata?.orderId);
    if (Number.isInteger(orderId) && orderId > 0 && tenantId) {
      const order = await db.order.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
        where: { id: orderId, tenantId },
      });
      if (order && order.paymentStatus !== "paid") {
        await order.update({ // codacy-suppress nosql-injection - parameterized ORM call
          paymentStatus: "paid",
          paymentReference: data.reference,
          paymentMethod: "paystack",
        });
        logger.info("WhatsApp order payment confirmed", {
          orderId,
          tenantId,
          reference: data.reference,
        });
        try {
          const customerPhone = data.metadata?.customerPhone || order.customer?.phone;
          if (customerPhone) {
            await messageTemplates.renderTemplate("order_payment_confirmed", { orderId: order.id }, tenantId).then(async (text) => {
              await require("../services/whatsapp.service").sendWhatsAppText(customerPhone, text, tenantId);
            });
          }
          const deliveryLocation = data.metadata?.deliveryLocation;
          if (deliveryLocation) {
            await deliveryService.createFromWhatsApp(
              tenantId,
              order.id,
              deliveryLocation,
              order.customer ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() : "Customer",
              customerPhone
            );
          }
        } catch (notifyErr) {
          logger.warn("Failed to send WhatsApp order confirmation or create delivery", {
            error: notifyErr.message,
            orderId,
            tenantId,
          });
        }
      }
    }
  }

  return res.status(200).json({ success: true });
};

module.exports = {
  listSubscriptionsHandler,
  updateSubscriptionsHandler,
  testHandler,
  paystackEventHandler,
};
