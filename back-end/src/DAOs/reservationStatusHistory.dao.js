const db = require("../db/models");
const ReservationStatusHistory = db.reservationStatusHistory;

const addHistory = async (data) => {
  return await ReservationStatusHistory.create(data);
};

const getHistoryByReservation = async (reservationId) => {
  return await ReservationStatusHistory.findAll({
    where: { reservationId },
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  addHistory,
  getHistoryByReservation,
};
