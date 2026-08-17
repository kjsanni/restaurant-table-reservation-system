const db = require("../../db/models");
const baseDAO = require("./base.dao");

const dataRetentionPolicyDAO = {};

dataRetentionPolicyDAO.create = async (payload) => {
  return await db.dataRetentionPolicy.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

dataRetentionPolicyDAO.list = (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.dataRetentionPolicy.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["dataCategory", "ASC"]],
    limit: filters.limit || 100,
  });
};

dataRetentionPolicyDAO.findById = (id) => {
  return db.dataRetentionPolicy.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

dataRetentionPolicyDAO.update = async (id, updates) => baseDAO.updateById(db.dataRetentionPolicy, id, updates);

dataRetentionPolicyDAO.remove = async (id) => baseDAO.removeById(db.dataRetentionPolicy, id);

module.exports = dataRetentionPolicyDAO;
