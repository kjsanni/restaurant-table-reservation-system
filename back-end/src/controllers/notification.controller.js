const notificationService = require("../services/notification.service");
const whatsappService = require("../services/whatsapp.service");
const emailService = require("../services/emailService");
const authDAO = require("../DAOs/auth.dao");
const db = require("../db/models");

const scheduleRemindersHandler = async (req, res) => {
  const results = await notificationService.scheduleReminders(req.tenant?.id);
  return res.status(200).json({ success: true, results });
};

const testWhatsAppHandler = async (req, res) => {
  const { to, message } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, message: "Recipient phone is required." });
  }
  try {
    const text = message || "This is a test message from your reservation system.";
    const result = await whatsappService.sendWhatsAppText(to, text);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const paystackWebhookInfoHandler = async (req, res) => {
  const baseUrl =
    process.env.APP_URL ||
    `${req.protocol}://${req.get("host")}`;
  const webhookUrl = `${baseUrl}/api/v1/billing/webhook`;
  let lastEvent = null;
  try {
    lastEvent = await db.paystackEvent.findOne({
      order: [["createdAt", "DESC"]],
    });
  } catch {
    lastEvent = null;
  }
  return res.status(200).json({
    success: true,
    webhookUrl,
    lastEvent: lastEvent
      ? {
          event: lastEvent.event,
          paystackEventId: lastEvent.paystackEventId,
          createdAt: lastEvent.createdAt,
        }
      : null,
  });
};

const testEmailHandler = async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, message: "Recipient email is required." });
  }
  try {
    const setting = await authDAO.getSettingByKey("email_server", req.tenant?.id);
    const config =
      setting && setting.value
        ? typeof setting.value === "string"
          ? JSON.parse(setting.value)
          : setting.value
        : null;
    if (!config || !config.host) {
      return res
        .status(400)
        .json({ success: false, message: "Email server is not configured." });
    }
    await emailService.sendEmail({
      to,
      subject: "Reservation System — Test Email",
      text: "This is a test email from your reservation system.",
    });
    return res.status(200).json({ success: true, message: "Test email sent." });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  scheduleRemindersHandler,
  testWhatsAppHandler,
  testEmailHandler,
  paystackWebhookInfoHandler,
};
