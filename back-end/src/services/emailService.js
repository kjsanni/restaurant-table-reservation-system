const nodemailer = require("nodemailer");
const db = require("../db/models");
const logger = require("../utils/logger");

const EMAIL_SETTING_KEY = "email_server";
const EMAIL_THEME_KEY = "email_theme";
const EMAIL_TEMPLATES_KEY = "email_templates";

const DEFAULT_EMAIL_THEME = {
  brandName: "Restaurant",
  logoUrl: "",
  primaryColor: "#d97706",
  footerText: "",
};

const DEFAULT_EMAIL_TEMPLATES = {
  reservation_confirmation: {
    subject: "Reservation Confirmed – {{customer_name}}",
    html: "<p>Hi {{customer_name}},</p><p>Your reservation at <strong>{{brandName}}</strong> is confirmed for <strong>{{reservation_time}}</strong> for {{party_size}} guests at table {{table_name}}.</p><p>We look forward to seeing you!</p>",
  },
  reservation_cancelled: {
    subject: "Reservation Cancelled – {{customer_name}}",
    html: "<p>Hi {{customer_name}},</p><p>Your reservation for <strong>{{reservation_time}}</strong> has been cancelled. If this was a mistake, please contact us to rebook.</p>",
  },
  waitlist_promoted: {
    subject: "A Table is Ready – {{customer_name}}",
    html: "<p>Hi {{customer_name}},</p><p>Good news! A table is now ready for your party of {{party_size}}. Please arrive within the next 15 minutes to claim it.</p>",
  },
};

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
    const theme = setting && setting.value ? setting.value : {};
    let brand = {};
    try {
      const branding = await db.setting.findOne({ where: { key: "branding" } });
      if (branding && branding.value) {
        brand =
          typeof branding.value === "string"
            ? JSON.parse(branding.value)
            : branding.value;
      }
    } catch {
      brand = {};
    }
    return {
      ...DEFAULT_EMAIL_THEME,
      brandName: brand.brandName || DEFAULT_EMAIL_THEME.brandName,
      logoUrl: brand.logoUrl || "",
      primaryColor: brand.primaryColor || DEFAULT_EMAIL_THEME.primaryColor,
      ...theme,
    };
  } catch (err) {
    logger.error("Failed to read email_theme setting", { error: err.message });
    return { ...DEFAULT_EMAIL_THEME };
  }
};

const getEmailTemplates = async () => {
  try {
    const setting = await db.setting.findOne({
      where: { key: EMAIL_TEMPLATES_KEY },
    });
    if (!setting) return { ...DEFAULT_EMAIL_TEMPLATES };
    return { ...DEFAULT_EMAIL_TEMPLATES, ...(setting.value || {}) };
  } catch (err) {
    logger.error("Failed to read email_templates setting", { error: err.message });
    return { ...DEFAULT_EMAIL_TEMPLATES };
  }
};

const getEmailTemplateDefaults = () => ({
  theme: { ...DEFAULT_EMAIL_THEME },
  templates: JSON.parse(JSON.stringify(DEFAULT_EMAIL_TEMPLATES)),
});

const buildTransporter = (config) => {
  const tls = {};
  if (config.insecureTls === true) {
    tls.rejectUnauthorized = false;
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    ...(Object.keys(tls).length > 0 ? { tls } : {}),
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
  DEFAULT_EMAIL_THEME,
  DEFAULT_EMAIL_TEMPLATES,
  getEmailConfig,
  getEmailTheme,
  getEmailTemplates,
  getEmailTemplateDefaults,
  buildTransporter,
  renderTemplate,
  sendEmail,
  sendTemplate,
  verifyConfig,
};
