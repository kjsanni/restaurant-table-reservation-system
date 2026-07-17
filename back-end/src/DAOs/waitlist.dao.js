const db = require("../db/models");
const Waitlist = db.waitlist;
const Reservation = db.reservation;
const Customer = db.customer;
const { Op } = db.Sequelize;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const findById = async (id, tenantId) => {
  return await Waitlist.findOne({
    where: withTenant({ id }, tenantId),
  });
};

const createEntry = async (data, tenantId) => {
  return await Waitlist.create({
    ...data,
    ...withTenant({}, tenantId),
  });
};

const createFromReservation = async (reservationId, tenantId) => {
  const reservation = await Reservation.findOne({
    where: withTenant({ id: reservationId }, tenantId),
    include: [
      {
        model: Customer,
        attributes: ["firstName", "lastName", "phone", "email"],
      },
    ],
  });

  if (!reservation) {
    return null;
  }

  const customer = reservation.Customer || {};
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Guest";

  return await Waitlist.create({
    name,
    partySize: reservation.people || 2,
    phone: customer.phone || null,
    email: customer.email || null,
    desiredTime: reservation.resTime || null,
    notes: reservation.notes || null,
    status: "waiting",
    ...withTenant({}, tenantId),
  });
};

const updateEntry = async (id, updates, tenantId) => {
  const entry = await Waitlist.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!entry) return null;
  return await entry.update(updates);
};

const deleteEntry = async (id, tenantId) => {
  const entry = await Waitlist.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!entry) return null;
  await entry.destroy();
  return true;
};

const getWaitingList = async (filters = {}, tenantId) => {
  const where = withTenant({ status: "waiting" }, tenantId);

  if (filters.desiredTime) {
    where.desiredTime = filters.desiredTime;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  return await Waitlist.findAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "firstName", "lastName", "email", "phone", "visitCount", "preferences"],
        required: false,
      },
    ],
    order: [["createdAt", "ASC"]],
  });
};

const markSeated = async (id, tenantId) => {
  return await updateEntry(id, {
    status: "seated",
    seatedAt: new Date(),
  }, tenantId);
};

const markExpired = async (id, tenantId) => {
  return await updateEntry(id, { status: "expired" }, tenantId);
};

const markCancelled = async (id, tenantId) => {
  return await updateEntry(id, { status: "cancelled" }, tenantId);
};

const expireOldEntries = async (tenantId) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await Waitlist.update(
    { status: "expired" },
    {
      where: withTenant({
        status: "waiting",
        createdAt: { [Op.lte]: oneHourAgo },
      }, tenantId),
    }
  );
  return result[0];
};

const getStats = async (tenantId) => {
  const waiting = await Waitlist.count({ where: withTenant({ status: "waiting" }, tenantId) });
  const seated = await Waitlist.count({ where: withTenant({ status: "seated" }, tenantId) });
  const expired = await Waitlist.count({ where: withTenant({ status: "expired" }, tenantId) });
  const cancelled = await Waitlist.count({ where: withTenant({ status: "cancelled" }, tenantId) });
  return { waiting, seated, expired, cancelled, total: waiting + seated + expired + cancelled };
};

const getBestMatch = async (tableId, tenantId) => {
  const table = await db.table.findOne({
    where: withTenant({ id: tableId }, tenantId),
  });
  if (!table) return null;

  const entries = await Waitlist.findAll({
    where: withTenant({ status: "waiting" }, tenantId),
    order: [["createdAt", "ASC"]],
  });

  const capacity = table.capacity || 2;
  const fits = entries.filter((entry) => entry.partySize <= capacity);
  if (!fits.length) return null;

  const best = fits.reduce((a, b) => {
    const aDiff = capacity - a.partySize;
    const bDiff = capacity - b.partySize;
    if (aDiff !== bDiff) return aDiff < bDiff ? a : b;
    return a.createdAt < b.createdAt ? a : b;
  });

  return best;
};

module.exports = {
  findById,
  createEntry,
  createFromReservation,
  updateEntry,
  deleteEntry,
  getWaitingList,
  markSeated,
  markExpired,
  markCancelled,
  expireOldEntries,
  getStats,
  getBestMatch,
};
