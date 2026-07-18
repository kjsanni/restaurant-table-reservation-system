const mailService = require("./mail.service");
const whatsappService = require("./whatsapp.service");
const reservationDAO = require("../DAOs/reservation.dao");
const settingDAO = require("../DAOs/auth.dao");
const dateTimeValidator = require("../utils/dateAndTimeValidator");

const resolveChannels = async (tenantId, requested) => {
  if (Array.isArray(requested) && requested.length > 0) return requested;
  try {
    const setting = await settingDAO.getSettingValue(
      "notification_channels",
      { email: true, whatsapp: false },
      tenantId
    );
    const channels = [];
    if (setting?.email) channels.push("email");
    if (setting?.whatsapp) channels.push("whatsapp");
    if (channels.length > 0) return channels;
  } catch {
    // ignore and fall back to default
  }
  return ["email"];
};

const sendViaChannels = async (reservation, templateData, channels = ["email"], tenantId, whatsappTemplate = null) => {
  const results = [];
  for (const channel of channels) {
    if (channel === "email" && reservation.customerEmail) {
      try {
        await mailService.sendMail(reservation.customerEmail, "reminder", templateData, tenantId);
        results.push({ channel: "email", sent: true });
      } catch (err) {
        results.push({ channel: "email", sent: false, error: err.message });
      }
    } else if (channel === "whatsapp" && reservation.customerPhone) {
      try {
        const text = buildWhatsAppText(templateData, whatsappTemplate);
        await whatsappService.sendWhatsAppText(reservation.customerPhone, text, tenantId);
        results.push({ channel: "whatsapp", sent: true });
      } catch (err) {
        results.push({ channel: "whatsapp", sent: false, error: err.message });
      }
    }
  }
  return results;
};

const renderTemplate = (template, data = {}) => {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
};

const DEFAULT_WHATSAPP_REMINDER =
  "Hi {{name}},\n\nThis is a reminder for your reservation on {{date}} at {{time}} for {{partySize}} people.\nTable: {{table}}\n{{restaurantName}}\n\nSee you soon!";

const buildWhatsAppText = (data, template) => {
  return renderTemplate(template || DEFAULT_WHATSAPP_REMINDER, data);
};

const scheduleReminders = async (tenantId, channels = null) => {
  const resolved = await resolveChannels(tenantId, channels);
  const whatsappTemplate = await getWhatsAppReminderTemplate(tenantId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = dateTimeValidator.asDateString(tomorrow);

  const reservations = await reservationDAO.findAllReservationsRaw({
    resDate: tomorrowStr,
    resStatus: "confirmed",
  }, tenantId);

  const results = [];
  for (const reservation of reservations) {
    const templateData = {
      name: reservation.customerName,
      date: reservation.resDate,
      time: reservation.resTime,
      partySize: reservation.people,
      table: reservation.tableName || "TBD",
      restaurantName: process.env.APP_NAME || "Restaurant",
    };

    const channelResults = await sendViaChannels(
      reservation,
      templateData,
      resolved,
      tenantId,
      whatsappTemplate
    );
    results.push({ reservationId: reservation.id, channels: channelResults });
  }

  return results;
};

const getWhatsAppReminderTemplate = async (tenantId) => {
  try {
    const templates = await settingDAO.getSettingValue(
      "message_templates",
      {},
      tenantId
    );
    return templates?.whatsapp_reminder || null;
  } catch {
    return null;
  }
};

const sendConfirmation = async (reservation, channels = null, tenantId) => {
  const resolved = await resolveChannels(tenantId, channels);
  const templateData = {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  return await sendViaChannels(reservation, templateData, resolved, tenantId);
};

const sendCancellation = async (reservation, channels = null, tenantId) => {
  const resolved = await resolveChannels(tenantId, channels);
  const templateData = {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  return await sendViaChannels(reservation, templateData, resolved, tenantId);
};

module.exports = {
  scheduleReminders,
  sendConfirmation,
  sendCancellation,
  sendViaChannels,
  buildWhatsAppText,
  renderTemplate,
  getWhatsAppReminderTemplate,
};
