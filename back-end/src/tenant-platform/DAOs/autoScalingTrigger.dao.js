const db = require("../../db/models");
const baseDAO = require("./base.dao");

const autoScalingTriggerDAO = {};

autoScalingTriggerDAO.create = async (payload) => {
  return await db.autoScalingTrigger.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

autoScalingTriggerDAO.list = (filters = {}) => {
  const where = {};
  if (filters.metric) where.metric = filters.metric;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.autoScalingTrigger.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

autoScalingTriggerDAO.findById = (id) => {
  return db.autoScalingTrigger.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

autoScalingTriggerDAO.update = async (id, updates) => baseDAO.updateById(db.autoScalingTrigger, id, updates);

autoScalingTriggerDAO.remove = async (id) => baseDAO.removeById(db.autoScalingTrigger, id);

module.exports = autoScalingTriggerDAO;
