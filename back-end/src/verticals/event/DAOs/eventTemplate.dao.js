"use strict";

const db = require("../../../db/models");
const { Op } = require("sequelize");

const eventTemplateDAO = {};

eventTemplateDAO.create = async (data) => {
  return db.eventTemplate.create(data);
};

eventTemplateDAO.findById = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  return db.eventTemplate.findOne({ where });
};

eventTemplateDAO.list = async (tenantId, filters = {}) => {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (filters.category) where.category = filters.category;
  if (filters.isSystem !== undefined) where.isSystem = filters.isSystem;

  const { rows, count } = await db.eventTemplate.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit ? parseInt(filters.limit, 10) : 50,
    offset: filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined,
  });

  return { rows, count };
};

eventTemplateDAO.update = async (id, tenantId, updates) => {
  const template = await eventTemplateDAO.findById(id, tenantId);
  if (!template) return null;
  await template.update(updates);
  return template;
};

eventTemplateDAO.remove = async (id, tenantId) => {
  const template = await eventTemplateDAO.findById(id, tenantId);
  if (!template) return false;
  await template.destroy();
  return true;
};

module.exports = eventTemplateDAO;
