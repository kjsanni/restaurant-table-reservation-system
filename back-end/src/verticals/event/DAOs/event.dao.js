"use strict";

const db = require("../../../db/models");
const { Op } = require("sequelize");

const eventDAO = {};

eventDAO.create = async (data) => {
  return db.Event.create(data);
};

eventDAO.findById = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.Event.findOne({ where });
};

eventDAO.list = async (tenantId, filters = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filters.search}%` } },
      { venue: { [Op.like]: `%${filters.search}%` } },
    ];
  }
  if (filters.fromDate) where.eventDate = { [Op.gte]: filters.fromDate };
  if (filters.toDate) where.eventDate = { ...where.eventDate, [Op.lte]: filters.toDate };

  const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.Event.findAndCountAll({
    where,
    order: [["eventDate", "DESC"]],
    limit,
    offset,
  });

  return { rows, count };
};

eventDAO.update = async (id, tenantId, updates) => {
  const event = await eventDAO.findById(id, tenantId);
  if (!event) return null;
  await event.update(updates);
  return event;
};

eventDAO.delete = async (id, tenantId) => {
  const event = await eventDAO.findById(id, tenantId);
  if (!event) return false;
  await event.destroy();
  return true;
};

module.exports = eventDAO;
