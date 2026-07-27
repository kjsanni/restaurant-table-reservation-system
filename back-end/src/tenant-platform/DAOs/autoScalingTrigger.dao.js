const db = require("../../db/models");

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

autoScalingTriggerDAO.update = async (id, updates) => {
  const trigger = await autoScalingTriggerDAO.findById(id);
  if (!trigger) return null;
  await trigger.update(updates);
  return trigger;
};

autoScalingTriggerDAO.remove = async (id) => {
  const trigger = await autoScalingTriggerDAO.findById(id);
  if (!trigger) return null;
  await trigger.destroy();
  return trigger;
};

module.exports = autoScalingTriggerDAO;
