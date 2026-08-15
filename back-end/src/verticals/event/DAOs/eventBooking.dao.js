"use strict";

const db = require("../../../db/models");
const { Op } = require("sequelize");

const eventBookingDAO = {};

eventBookingDAO.create = async (data) => {
  return db.eventBooking.create(data);
};

eventBookingDAO.findById = async (id, tenantId) => { // codacy-suppress nosql-injection
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.eventBooking.findOne({
    where,
    include: [
      { model: db.event, as: "event" },
      { model: db.ticketType, as: "ticketType" },
      { model: db.customer, as: "customer" },
    ],
  });
};

eventBookingDAO.list = async (tenantId, filters = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.search) {
    where[Op.or] = [
      { guestName: { [Op.like]: `%${filters.search}%` } },
      { guestEmail: { [Op.like]: `%${filters.search}%` } },
      { paymentReference: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.eventBooking.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    include: [
      { model: db.event, as: "event" },
      { model: db.ticketType, as: "ticketType" },
    ],
  });

  return { rows, count };
};

eventBookingDAO.update = async (id, tenantId, updates) => {
  const booking = await eventBookingDAO.findById(id, tenantId);
  if (!booking) return null;
  await booking.update(updates);
  return booking;
};

eventBookingDAO.findByReference = async (reference, tenantId) => { // codacy-suppress nosql-injection
  const where = { paymentReference: reference };
  if (!tenantId) {
    throw new Error("tenantId is required for payment reference lookup");
  }
  where.tenantId = tenantId;
  return db.eventBooking.findOne({
    where,
    include: [
      { model: db.event, as: "event" },
      { model: db.ticketType, as: "ticketType" },
    ],
  });
};

eventBookingDAO.countConfirmedByEvent = async (eventId, tenantId) => { // codacy-suppress nosql-injection
  const result = await db.eventBooking.findOne({
    where: { eventId, tenantId, status: "confirmed" },
    attributes: [
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "totalConfirmed"],
    ],
    raw: true,
  });
  return Number(result?.totalConfirmed || 0);
};

module.exports = eventBookingDAO;
