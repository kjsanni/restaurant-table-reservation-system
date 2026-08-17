"use strict";

const db = require("../../../db/models");
const { Op } = require("sequelize");

const ticketTypeDAO = {};

ticketTypeDAO.create = async (data) => {
  return db.TicketType.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

ticketTypeDAO.findById = async (id, eventId, tenantId) => {
  const where = { id };
  if (eventId) where.eventId = eventId;
  if (tenantId) where.tenantId = tenantId;
  return db.TicketType.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

ticketTypeDAO.list = async (eventId, tenantId, filters = {}) => {
  const where = { eventId };
  if (tenantId) where.tenantId = tenantId;

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.TicketType.findAndCountAll({
    where,
    order: [["createdAt", "ASC"]],
    limit,
    offset,
  });

  return { rows, count };
};

ticketTypeDAO.update = async (id, eventId, tenantId, updates) => {
  const ticketType = await ticketTypeDAO.findById(id, eventId, tenantId);
  if (!ticketType) return null;
  await ticketType.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return ticketType;
};

ticketTypeDAO.delete = async (id, eventId, tenantId) => {
  const ticketType = await ticketTypeDAO.findById(id, eventId, tenantId);
  if (!ticketType) return false;
  await ticketType.destroy();
  return true;
};

ticketTypeDAO.deleteByEventId = async (eventId, tenantId) => {
  await db.TicketType.destroy({
    where: { eventId, ...(tenantId ? { tenantId } : {}) },
  });
  return true;
};

module.exports = ticketTypeDAO;
