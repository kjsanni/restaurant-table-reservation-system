"use strict";

const db = require("../../../db/models");
const { Op } = require("sequelize");

const guestListDAO = {};

guestListDAO.create = async (data) => {
  return db.GuestList.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

guestListDAO.findById = async (id, eventId, tenantId) => {
  const where = { id };
  if (eventId) where.eventId = eventId;
  if (tenantId) where.tenantId = tenantId;
  return db.GuestList.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

guestListDAO.list = async (eventId, tenantId, filters = {}) => {
  const where = { eventId };
  if (tenantId) where.tenantId = tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where[Op.or] = [
      { guestName: { [Op.like]: `%${filters.search}%` } },
      { guestEmail: { [Op.like]: `%${filters.search}%` } },
      { guestPhone: { [Op.like]: `%${filters.search}%` } },
    ];
  }

  const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.GuestList.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return { rows, count };
};

guestListDAO.update = async (id, eventId, tenantId, updates) => {
  const guest = await guestListDAO.findById(id, eventId, tenantId);
  if (!guest) return null;
  await guest.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return guest;
};

guestListDAO.delete = async (id, eventId, tenantId) => {
  const guest = await guestListDAO.findById(id, eventId, tenantId);
  if (!guest) return false;
  await guest.destroy();
  return true;
};

guestListDAO.deleteByEventId = async (eventId, tenantId) => {
  await db.GuestList.destroy({
    where: { eventId, ...(tenantId ? { tenantId } : {}) },
  });
  return true;
};

guestListDAO.findByGuestListId = async (guestListId, tenantId) => {
  const where = { id: guestListId };
  if (tenantId) where.tenantId = tenantId;
  return db.GuestList.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

module.exports = guestListDAO;
