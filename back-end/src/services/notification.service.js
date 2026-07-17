const mailService = require("./mail.service");
const reservationDAO = require("../DAOs/reservation.dao");

const scheduleReminders = async (tenantId) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const reservations = await reservationDAO.findAllReservationsRaw({
    resDate: tomorrowStr,
    resStatus: "confirmed",
  }, tenantId);

  const results = [];
  for (const reservation of reservations) {
    if (!reservation.customerEmail) continue;
    try {
      await mailService.sendMail(reservation.customerEmail, "reminder", {
        name: reservation.customerName,
        date: reservation.resDate,
        time: reservation.resTime,
        partySize: reservation.people,
        table: reservation.tableName || "TBD",
        restaurantName: process.env.APP_NAME || "Restaurant",
      });
      results.push({ reservationId: reservation.id, sent: true });
    } catch (err) {
      results.push({ reservationId: reservation.id, sent: false, error: err.message });
    }
  }

  return results;
};

const sendConfirmation = async (reservation) => {
  if (!reservation?.customerEmail) return;
  await mailService.sendMail(reservation.customerEmail, "confirmation", {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  });
};

const sendCancellation = async (reservation) => {
  if (!reservation?.customerEmail) return;
  await mailService.sendMail(reservation.customerEmail, "cancellation", {
    name: reservation.customerName,
    date: reservation.resDate,
    time: reservation.resTime,
    partySize: reservation.people,
    table: reservation.tableName || "TBD",
    restaurantName: process.env.APP_NAME || "Restaurant",
  });
};

module.exports = {
  scheduleReminders,
  sendConfirmation,
  sendCancellation,
};
