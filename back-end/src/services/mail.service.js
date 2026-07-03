const nodemailer = require("nodemailer");

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: Number(process.env.SMTP_SECURE || 0) === 1,
    auth: { user, pass },
  });
};

const renderTemplate = (template, data = {}) => {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");
};

const templates = {
  confirmation: {
    subject: "Reservation Confirmed - {{restaurantName}}",
    body: `Hi {{name}},\n\nYour reservation for {{date}} at {{time}} has been confirmed.\nParty size: {{partySize}}\nTable: {{table}}\n\nSee you soon!\n{{restaurantName}}`,
  },
  reminder: {
    subject: "Reminder: Your reservation tomorrow at {{restaurantName}}",
    body: `Hi {{name}},\n\nThis is a reminder for your upcoming reservation:\nDate: {{date}}\nTime: {{time}}\nParty size: {{partySize}}\n\nReply to this email if you need to make changes.\n{{restaurantName}}`,
  },
  cancellation: {
    subject: "Your reservation has been cancelled",
    body: `Hi {{name}},\n\nYour reservation for {{date}} at {{time}} has been cancelled.\nIf this was a mistake, please contact us.\n{{restaurantName}}`,
  },
};

const sendMail = async (to, templateKey, data = {}) => {
  const template = templates[templateKey] || templates.confirmation;
  const subject = renderTemplate(template.subject, data);
  const text = renderTemplate(template.body, data);

  const transporter = buildTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};

module.exports = {
  sendMail,
  templates,
};
