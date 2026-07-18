const historyDAO = require("../DAOs/reservationStatusHistory.dao");

const recordStatusChange = async (reservationId, fromStatus, toStatus, actorId, tenantId, metadata = {}) => {
  return await historyDAO.addHistory({
    reservationId,
    fromStatus,
    toStatus,
    actorId,
    actorType: actorId ? "user" : "system",
    metadata,
  }, tenantId);
};

const getStatusHistory = async (reservationId, tenantId) => {
  return await historyDAO.getHistoryByReservation(reservationId, tenantId);
};

module.exports = {
  recordStatusChange,
  getStatusHistory,
};
