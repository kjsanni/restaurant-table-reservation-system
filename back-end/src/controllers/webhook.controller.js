const webhookService = require("../services/webhook.service");
const failedPaymentAlertDAO = require("../tenant-platform/DAOs/failedPaymentAlert.dao");
const db = require("../db/models");
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
      const tenant = await db.tenant.findByPk(data.metadata.tenantId);
      if (tenant) tenantId = tenant.id;
    }

    await failedPaymentAlertDAO.create({
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
      const tenant = await db.tenant.findByPk(data.metadata.tenantId);
      if (tenant) tenantId = tenant.id;
    }

    const appointmentId = data.metadata?.appointmentId;
    if (appointmentId && tenantId) {
      const appointment = await db.appointment.findOne({
        where: { id: appointmentId, tenantId },
      });
      if (appointment && appointment.paymentStatus !== "paid") {
        await appointment.update({
          paymentStatus: "paid",
          depositAmount: parseFloat(data.amount || 0) / 100,
        });
      }
    }

    const bookingId = data.metadata?.bookingId;
    if (bookingId && tenantId) {
      const booking = await db.eventBooking.findOne({
        where: { id: bookingId, tenantId },
      });
      if (booking && booking.paymentStatus !== "paid") {
        await booking.update({
          paymentStatus: "paid",
          status: "confirmed",
          paymentReference: data.reference,
          paymentMethod: "paystack",
        });
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
