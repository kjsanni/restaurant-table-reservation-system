const db = require("../db/models");
const ReservationStatusHistory = db.reservationStatusHistory;

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

const addHistory = async (data, tenantId) => {
  return await ReservationStatusHistory.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...data,
    ...withTenant({}, tenantId),
  });
};

const getHistoryByReservation = async (reservationId, tenantId) => {
  return await ReservationStatusHistory.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ reservationId }, tenantId),
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  addHistory,
  getHistoryByReservation,
};
