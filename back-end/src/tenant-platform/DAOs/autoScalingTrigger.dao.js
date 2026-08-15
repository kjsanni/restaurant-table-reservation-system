const db = require("../../db/models");
const baseDAO = require("./base.dao");

const autoScalingTriggerDAO = {};

autoScalingTriggerDAO.create = async (payload) => {
  return await db.autoScalingTrigger.create(payload);
};

autoScalingTriggerDAO.list = (filters = {}) => {
  const where = {};
  if (filters.metric) where.metric = filters.metric;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.autoScalingTrigger.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

autoScalingTriggerDAO.findById = (id) => {
  return db.autoScalingTrigger.findByPk(id);
};

autoScalingTriggerDAO.update = async (id, updates) => baseDAO.updateById(db.autoScalingTrigger, id, updates);

autoScalingTriggerDAO.remove = async (id) => baseDAO.removeById(db.autoScalingTrigger, id);

module.exports = autoScalingTriggerDAO;
