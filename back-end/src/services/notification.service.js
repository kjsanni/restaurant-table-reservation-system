const mailService = require("./mail.service");
const whatsappService = require("./whatsapp.service");
const reservationDAO = require("../DAOs/reservation.dao");
const dateTimeValidator = require("../utils/dateAndTimeValidator");

const sendViaChannels = async (reservation, templateData, channels = ["email"]) => {
  const results = [];
  for (const channel of channels) {
    if (channel === "email" && reservation.customerEmail) {
      try {
        await mailService.sendMail(reservation.customerEmail, "reminder", templateData);
        results.push({ channel: "email", sent: true });
      } catch (err) {
        results.push({ channel: "email", sent: false, error: err.message });
      }
    } else if (channel === "whatsapp" && reservation.customerPhone) {
      try {
        const text = buildWhatsAppText(templateData);
        await whatsappService.sendWhatsAppText(reservation.customerPhone, text);
        results.push({ channel: "whatsapp", sent: true });
      } catch (err) {
        results.push({ channel: "whatsapp", sent: false, error: err.message });
      }
    }
  }
  return results;
};

const buildWhatsAppText = (data) => {
  return `Hi ${data.name},\n\nThis is a reminder for your reservation on ${data.date} at ${data.time} for ${data.partySize} people.\nTable: ${data.table}\n${data.restaurantName}\n\nSee you soon!`;
};

const scheduleReminders = async (tenantId, channels = ["email"]) => {
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

    const channelResults = await sendViaChannels(reservation, templateData, channels);
    results.push({ reservationId: reservation.id, channels: channelResults });
  }

  return results;
};

const sendConfirmation = async (reservation, channels = ["email"]) => {
  const templateData = {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  return await sendViaChannels(reservation, templateData, channels);
};

const sendCancellation = async (reservation, channels = ["email"]) => {
  const templateData = {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  };
  return await sendViaChannels(reservation, templateData, channels);
};

module.exports = {
  scheduleReminders,
  sendConfirmation,
  sendCancellation,
  sendViaChannels,
};
