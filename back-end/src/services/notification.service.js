const mailService = require("./mail.service");
const whatsappService = require("./whatsapp.service");
const reservationDAO = require("../DAOs/reservation.dao");
const salonAppointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const settingDAO = require("../DAOs/auth.dao");
const dateTimeValidator = require("../utils/dateAndTimeValidator");
const { notificationQueue, safeAdd } = require("../queues/queue");
const { client } = require("../utils/cache");
const smsService = require("./sms.service");

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

// Build the per-channel job payloads for a reservation notification. Keeps the
// tenantId on every payload so workers process in the correct tenant scope.
const buildNotificationPayloads = (reservation, templateData, channels, tenantId, whatsappTemplate = null) => {
  const payloads = [];
  for (const channel of channels) {
    if (channel === "email" && reservation.customerEmail) {
      payloads.push({
        type: "email",
        tenantId,
        payload: {
          to: reservation.customerEmail,
          templateKey: templateData.__template,
          data: { ...templateData },
          tenantId,
        },
      });
    } else if (channel === "whatsapp" && reservation.customerPhone) {
      payloads.push({
        type: "whatsapp",
        tenantId,
        payload: {
          to: reservation.customerPhone,
          text: buildWhatsAppText(templateData, whatsappTemplate),
          tenantId,
        },
      });
    }
  }
  return payloads;
};

const enqueueConfirmation = async (reservation, channels = null, tenantId) => {
  const resolved = await resolveChannels(tenantId, channels);
  const templateData = {
    __template: "confirmation",
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  const payloads = buildNotificationPayloads(reservation, templateData, resolved, tenantId);
  const result = await safeAdd(notificationQueue, "confirmation", {
    type: "batch",
    tenantId,
    items: payloads,
  });
  return result.enqueued;
};

const enqueueCancellation = async (reservation, channels = null, tenantId) => {
  const resolved = await resolveChannels(tenantId, channels);
  const templateData = {
    __template: "cancellation",
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  const payloads = buildNotificationPayloads(reservation, templateData, resolved, tenantId);
  const result = await safeAdd(notificationQueue, "cancellation", {
    type: "batch",
    tenantId,
    items: payloads,
  });
  return result.enqueued;
};

// Enqueue reminder jobs for all confirmed reservations tomorrow. Returns
// { enqueued: boolean, count } so the controller can fall back to synchronous
// processing when Redis is unavailable.
const enqueueReminders = async (tenantId, channels = null) => {
  const resolved = await resolveChannels(tenantId, channels);
  const whatsappTemplate = await getWhatsAppReminderTemplate(tenantId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = dateTimeValidator.asDateString(tomorrow);

  const reservations = await reservationDAO.findAllReservationsRaw(
    { resDate: tomorrowStr, resStatus: "confirmed" },
    tenantId
  );

  const items = [];
  for (const reservation of reservations) {
    const templateData = {
      __template: "reminder",
      name: reservation.customerName,
      date: reservation.resDate,
      time: reservation.resTime,
      partySize: reservation.people,
      table: reservation.tableName || "TBD",
      restaurantName: process.env.APP_NAME || "Restaurant",
    };
    items.push(
      ...buildNotificationPayloads(reservation, templateData, resolved, tenantId, whatsappTemplate)
    );
  }

  if (items.length === 0) {
    return { enqueued: true, count: 0 };
  }

  const result = await safeAdd(notificationQueue, "reminders", {
    type: "batch",
    tenantId,
    items,
  });
  return { enqueued: result.enqueued, count: result.enqueued ? items.length : 0 };
};

const enqueueSalonAppointmentReminders = async (tenantId, channels = null) => {
  const resolved = await resolveChannels(tenantId, channels);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const result = await salonAppointmentDao.findAllForTenant(tenantId, {
    status: "confirmed",
    from: now.toISOString(),
    to: windowEnd.toISOString(),
    limit: 100,
  });

  const appointments = result.data || [];
  const items = [];
  for (const appointment of appointments) {
    const customer = appointment.customer || {};
    const service = appointment.service || {};
    const templateData = {
      __template: "salon_appointment_reminder",
      name: customer.firstName || customer.lastName || "Guest",
      service: service.name || "Appointment",
      date: appointment.start ? new Date(appointment.start).toISOString().slice(0, 10) : "",
      time: appointment.start ? new Date(appointment.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      duration: appointment.durationMinutes || 30,
      salonName: process.env.APP_NAME || "Salon",
    };
    items.push({
      type: "whatsapp",
      tenantId,
      to: customer.phone,
      payload: { text: buildWhatsAppText(templateData), templateData },
    });
  }

  if (items.length === 0) {
    return { enqueued: true, count: 0 };
  }

  const enqueueResult = await safeAdd(notificationQueue, "salon_appointment_reminders", {
    type: "batch",
    tenantId,
    items,
  });
  return { enqueued: enqueueResult.enqueued, count: enqueueResult.enqueued ? items.length : 0 };
};

const FALLBACK_FAILURE_THRESHOLD = 2;
const FALLBACK_TTL_SECONDS = 60 * 60;

const getFailureKey = (tenantId, phone, channel = "whatsapp") =>
  `notification:fallback:${tenantId}:${phone}:${channel}`;

const getSmsFallbackEnabled = async (tenantId) => {
  try {
    const setting = await settingDAO.getSettingValue(
      "salon_sms_fallback_enabled",
      false,
      tenantId
    );
    return !!setting;
  } catch {
    return false;
  }
};

const incrementFailureCount = async (tenantId, phone) => {
  if (!client || !client.isReady) return 0;
  const key = getFailureKey(tenantId, phone);
  const count = await client.incr(key);
  await client.expire(key, FALLBACK_TTL_SECONDS);
  return count;
};

const resetFailureCount = async (tenantId, phone) => {
  if (!client || !client.isReady) return;
  const key = getFailureKey(tenantId, phone);
  await client.del(key);
};

const sendWithSmsFallback = async (phone, text, tenantId) => {
  try {
    await whatsappService.sendWhatsAppText(phone, text, tenantId);
    await resetFailureCount(tenantId, phone);
    return { channel: "whatsapp", success: true };
  } catch (err) {
    const failures = await incrementFailureCount(tenantId, phone);
    if (failures >= FALLBACK_FAILURE_THRESHOLD && (await getSmsFallbackEnabled(tenantId))) {
      try {
        await smsService.sendSMS({ to: phone, message: text }, tenantId);
        await resetFailureCount(tenantId, phone);
        return { channel: "sms", success: true, fallback: true };
      } catch (smsErr) {
        return { channel: "whatsapp", success: false, error: err.message, smsError: smsErr.message };
      }
    }
    return { channel: "whatsapp", success: false, error: err.message, failures };
  }
};

module.exports = {
  scheduleReminders,
  sendConfirmation,
  sendCancellation,
  enqueueConfirmation,
  enqueueCancellation,
  enqueueReminders,
  enqueueSalonAppointmentReminders,
  sendViaChannels,
  buildWhatsAppText,
  renderTemplate,
  getWhatsAppReminderTemplate,
  sendWithSmsFallback,
  getSmsFallbackEnabled,
};
