const notificationService = require("../services/notificationService");
const emailService = require("../services/emailService");

const sendTestEmailHandler = async (req, res) => {
  const { to } = req.body;
  if (!to) {
    throw { status: 400, message: "Recipient email (to) is required." };
  }
  const config = await emailService.getEmailConfig();
  if (!config) {
    throw {
      status: 400,
      message:
        "Email server is not configured. Add SMTP settings in Admin Settings.",
    };
  }
  const info = await notificationService.sendEmail({
    to,
    subject: "RTRS Test Email",
    text: "This is a test email from the Restaurant Table Reservation System.",
  });
  return res.status(200).json({
    success: true,
    message: "Test email sent successfully.",
    messageId: info.messageId,
  });
};

const sendEmailHandler = async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject) {
    throw { status: 400, message: "Recipient (to) and subject are required." };
  }
  const info = await notificationService.sendEmail({ to, subject, text, html });
  return res.status(200).json({
    success: true,
    message: "Email sent successfully.",
    messageId: info.messageId,
  });
};

const sendTemplateHandler = async (req, res) => {
  const { templateType, to, data } = req.body;
  if (!templateType || !to) {
    throw { status: 400, message: "templateType and to are required." };
  }
  const info = await emailService.sendTemplate({ templateType, to, data });
  return res.status(200).json({
    success: true,
    message: "Template email sent.",
    messageId: info.messageId,
  });
};

const getTemplatesHandler = async (req, res) => {
  const templates = await emailService.getEmailTemplates();
  const theme = await emailService.getEmailTheme();
  return res.status(200).json({ success: true, templates, theme });
};

module.exports = {
  sendTestEmailHandler,
  sendEmailHandler,
  sendTemplateHandler,
  getTemplatesHandler,
};
