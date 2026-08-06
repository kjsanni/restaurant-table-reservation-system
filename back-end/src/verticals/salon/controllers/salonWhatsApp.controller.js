"use strict";
const db = require("../../db/models");
const { verifyWebhookSignature } = require("../../tenant-platform/services/paystack.service");
const { sendWithSmsFallback } = require("../../services/notification.service");
const messageTemplates = require("../../services/messageTemplates.service");

const ALLOWED_TEMPLATES = ["salon_payment_confirmed"];

const sendPaymentConfirmation = async (appointment) => {
  const customer = await db.user.findByPk(appointment.customerId);
  if (!customer?.phone) return;

  const start = new Date(appointment.start);
  const dateStr = start.toISOString().slice(0, 10);
  const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const templateName = "salon_payment_confirmed";
  if (!ALLOWED_TEMPLATES.includes(templateName)) {
    throw new Error(`Template not allowed: ${templateName}`);
  }

  const message = messageTemplates.render(templateName, {
    appointmentId: appointment.id,
    date: dateStr,
    time: timeStr,
  }) || `Payment confirmed for appointment #${appointment.id} on ${dateStr} at ${timeStr}. See you soon!`;

  await sendWithSmsFallback(customer.phone, message, appointment.tenantId);
};

const handleChargeSuccess = async (data) => {
  const appointmentId = data.metadata?.appointmentId;
  if (!appointmentId) return;

  const appointment = await db.appointment.findByPk(appointmentId);
  if (!appointment || appointment.paymentStatus === "paid") return;

  await appointment.update({
    paymentStatus: "paid",
    depositAmount: parseFloat(data.amount || 0) / 100,
  });

  await sendPaymentConfirmation(appointment);
};

const salonPaymentConfirmationHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = JSON.stringify(req.body);

  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body?.event;
  const data = req.body?.data || {};

  if (event === "charge.success") {
    await handleChargeSuccess(data);
  }

  return res.status(200).json({ success: true });
};

module.exports = {
  salonPaymentConfirmationHandler,
};
