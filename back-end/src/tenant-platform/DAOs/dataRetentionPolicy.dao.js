const db = require("../../db/models");

const dataRetentionPolicyDAO = {};

dataRetentionPolicyDAO.create = async (payload) => {
  return await db.dataRetentionPolicy.create(payload);
};

dataRetentionPolicyDAO.list = (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.dataRetentionPolicy.findAll({
    where,
    order: [["tableName", "ASC"]],
    limit: filters.limit || 100,
  });
};

dataRetentionPolicyDAO.findById = (id) => {
  return db.dataRetentionPolicy.findByPk(id);
};

dataRetentionPolicyDAO.update = async (id, updates) => {
  const policy = await dataRetentionPolicyDAO.findById(id);
  if (!policy) return null;
  await policy.update(updates);
  return policy;
};

dataRetentionPolicyDAO.remove = async (id) => {
  const policy = await dataRetentionPolicyDAO.findById(id);
  if (!policy) return null;
  await policy.destroy();
  return policy;
};

module.exports = dataRetentionPolicyDAO;
