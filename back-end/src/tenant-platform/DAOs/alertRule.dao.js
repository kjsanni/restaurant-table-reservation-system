const db = require("../../db/models");
const baseDAO = require("./base.dao");

const alertRuleDAO = {};

alertRuleDAO.create = async (payload) => {
  return await db.alertRule.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

alertRuleDAO.list = (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.metric) where.metric = filters.metric;

  return db.alertRule.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

alertRuleDAO.findById = (id) => {
  return db.alertRule.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

alertRuleDAO.update = async (id, updates) => baseDAO.updateById(db.alertRule, id, updates);

alertRuleDAO.remove = async (id) => baseDAO.removeById(db.alertRule, id);

alertRuleDAO.findActive = () => {
  return db.alertRule.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { isActive: true },
  });
};

module.exports = alertRuleDAO;
