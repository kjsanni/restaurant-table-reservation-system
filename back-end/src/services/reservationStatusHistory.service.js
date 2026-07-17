const historyDAO = require("../DAOs/reservationStatusHistory.dao");

const recordStatusChange = async (reservationId, fromStatus, toStatus, actorId, metadata = {}) => {
  return await historyDAO.addHistory({
    reservationId,
    fromStatus,
    toStatus,
    actorId,
    actorType: actorId ? "user" : "system",
    metadata,
  });
};

const getStatusHistory = async (reservationId) => {
  return await historyDAO.getHistoryByReservation(reservationId);
};

module.exports = {
  recordStatusChange,
  getStatusHistory,
};
