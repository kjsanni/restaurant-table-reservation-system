const nodemailer = require("nodemailer");
const db = require("../db/models");
const logger = require("../utils/logger");

const EMAIL_SETTING_KEY = "email_server";
const EMAIL_THEME_KEY = "email_theme";
const EMAIL_TEMPLATES_KEY = "email_templates";

const getEmailConfig = async () => {
  try {
    const setting = await db.setting.findOne({
      where: { key: EMAIL_SETTING_KEY },
    });
    if (!setting) return null;
    const value = setting.value || {};
    if (!value.host) return null;
    return {
      host: value.host,
      port: Number(value.port) || 587,
      secure: !!value.secure,
      user: value.user || "",
      pass: value.pass || "",
      from: value.from || value.user || "",
    };
  } catch (err) {
    logger.error("Failed to read email_server setting", { error: err.message });
    return null;
  }
};

const getEmailTheme = async () => {
  try {
    const setting = await db.setting.findOne({
      where: { key: EMAIL_THEME_KEY },
    });
    if (!setting) return { brandName: "Restaurant", primaryColor: "#3b82f6", footerText: "" };
    return setting.value || {};
  } catch (err) {
    logger.error("Failed to read email_theme setting", { error: err.message });
    return { brandName: "Restaurant", primaryColor: "#3b82f6", footerText: "" };
  }
};

const getEmailTemplates = async () => {
  try {
    const setting = await db.setting.findOne({
      where: { key: EMAIL_TEMPLATES_KEY },
    });
    if (!setting) {
      return {
        reservation_confirmation: { subject: "Reservation Confirmed", html: "<p>Your reservation is confirmed.</p>" },
        reservation_cancelled: { subject: "Reservation Cancelled", html: "<p>Your reservation was cancelled.</p>" },
        waitlist_promoted: { subject: "Table Ready", html: "<p>A table is ready for you.</p>" },
      };
    }
    return setting.value || {};
  } catch (err) {
    logger.error("Failed to read email_templates setting", { error: err.message });
    return {};
  }
};

const buildTransporter = (config) => {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    tls: { rejectUnauthorized: false },
  });
};

const renderTemplate = (html, data = {}) => {
  if (!html) return "";
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
};

const sendEmail = async ({ to, subject, text, html }) => {
  const config = await getEmailConfig();
  if (!config) {
    throw {
      status: 400,
      message:
        "Email server is not configured. Add SMTP settings in Admin Settings.",
    };
  }
  const transporter = buildTransporter(config);
  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text: text || "",
    html: html || "",
  });
  logger.info("Email sent", { to, messageId: info.messageId });
  return info;
};

const sendTemplate = async ({ templateType, to, data }) => {
  const templates = await getEmailTemplates();
  const theme = await getEmailTheme();
  const template = templates[templateType];
  if (!template) {
    throw { status: 400, message: `Unknown email template: ${templateType}` };
  }
  const mergedData = {
    brandName: theme.brandName,
    ...data,
  };
  const html = `<div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
    <h2 style="color:${theme.primaryColor || "#3b82f6"}">${theme.brandName}</h2>
    ${renderTemplate(template.html, mergedData)}
    <hr/><small>${theme.footerText || ""}</small>
  </div>`;
  const subject = renderTemplate(template.subject, mergedData);
  return sendEmail({ to, subject, html });
};

const verifyConfig = async (config) => {
  const transporter = buildTransporter(config);
  await transporter.verify();
  return true;
};

module.exports = {
  EMAIL_SETTING_KEY,
  EMAIL_THEME_KEY,
  EMAIL_TEMPLATES_KEY,
  getEmailConfig,
  getEmailTheme,
  getEmailTemplates,
  buildTransporter,
  renderTemplate,
  sendEmail,
  sendTemplate,
  verifyConfig,
};
