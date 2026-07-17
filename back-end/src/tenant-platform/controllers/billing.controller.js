const crypto = require("crypto");
const { verifyWebhookSignature } = require("../services/paystack.service");
const { syncFromPaymentGateway } = require("../services/tenantSubscription.service");
const db = require("../../db/models");

const webhookHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body.event;
  const data = req.body.data;

  try {
    switch (event) {
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
      case "subscription.cancelled":
        if (data.metadata && data.metadata.tenantId) {
          await syncFromPaymentGateway(data.metadata.tenantId, {
            event,
            nextBillingDate: data.next_payment_date,
            graceDays: 7,
          });
        }
        break;
      case "charge.success":
        if (data.metadata && data.metadata.tenantId) {
          const tenant = await db.tenant.findByPk(data.metadata.tenantId);
          if (tenant) {
            await tenant.update({
              lastPaymentAt: new Date(),
              subscriptionStatus: "active",
              status: "active",
              graceEndsAt: null,
            });
          }
        }
        break;
      default:
        break;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
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
