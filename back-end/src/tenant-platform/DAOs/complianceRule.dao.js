const db = require("../../db/models");
const baseDAO = require("./base.dao");

const complianceRuleDAO = {};

complianceRuleDAO.create = async (payload) => {
  return await db.complianceRule.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

complianceRuleDAO.list = (filters = {}) => {
  const where = {};
  if (filters.vertical) where.vertical = filters.vertical;

  return db.complianceRule.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["vertical", "ASC"], ["ruleKey", "ASC"]],
    limit: filters.limit || 100,
  });
};

complianceRuleDAO.findById = (id) => {
  return db.complianceRule.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

complianceRuleDAO.update = async (id, updates) => baseDAO.updateById(db.complianceRule, id, updates);

complianceRuleDAO.remove = async (id) => baseDAO.removeById(db.complianceRule, id);

module.exports = complianceRuleDAO;
