const db = require("../db/models");
const Waitlist = db.waitlist;
const Reservation = db.reservation;
const Customer = db.customer;
const { Op } = db.Sequelize;

const findById = async (id) => {
  return await Waitlist.findByPk(id);
};

const createEntry = async (data) => {
  return await Waitlist.create(data);
};

const createFromReservation = async (reservationId) => {
  const reservation = await Reservation.findByPk(reservationId, {
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
  });
};

const updateEntry = async (id, updates) => {
  const entry = await Waitlist.findByPk(id);
  if (!entry) return null;
  return await entry.update(updates);
};

const deleteEntry = async (id) => {
  const entry = await Waitlist.findByPk(id);
  if (!entry) return null;
  await entry.destroy();
  return true;
};

const getWaitingList = async (filters = {}) => {
  const where = { status: "waiting" };

  if (filters.desiredTime) {
    where.desiredTime = filters.desiredTime;
  }

  return await Waitlist.findAll({
    where,
    order: [["createdAt", "ASC"]],
  });
};

const markSeated = async (id) => {
  return await updateEntry(id, {
    status: "seated",
    seatedAt: new Date(),
  });
};

const markExpired = async (id) => {
  return await updateEntry(id, { status: "expired" });
};

const markCancelled = async (id) => {
  return await updateEntry(id, { status: "cancelled" });
};

const expireOldEntries = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await Waitlist.update(
    { status: "expired" },
    {
      where: {
        status: "waiting",
        createdAt: { [Op.lte]: oneHourAgo },
      },
    }
  );
  return result[0];
};

const getStats = async () => {
  const waiting = await Waitlist.count({ where: { status: "waiting" } });
  const seated = await Waitlist.count({ where: { status: "seated" } });
  const expired = await Waitlist.count({ where: { status: "expired" } });
  const cancelled = await Waitlist.count({ where: { status: "cancelled" } });
  return { waiting, seated, expired, cancelled, total: waiting + seated + expired + cancelled };
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
};
