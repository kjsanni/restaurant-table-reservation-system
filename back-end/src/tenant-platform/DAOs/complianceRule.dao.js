const db = require("../../db/models");
const baseDAO = require("./base.dao");

const complianceRuleDAO = {};

complianceRuleDAO.create = async (payload) => {
  return await db.complianceRule.create(payload);
};

complianceRuleDAO.list = (filters = {}) => {
  const where = {};
  if (filters.vertical) where.vertical = filters.vertical;

  return db.complianceRule.findAll({
    where,
    order: [["vertical", "ASC"], ["ruleKey", "ASC"]],
    limit: filters.limit || 100,
  });
};

complianceRuleDAO.findById = (id) => {
  return db.complianceRule.findByPk(id);
};

complianceRuleDAO.update = async (id, updates) => baseDAO.updateById(db.complianceRule, id, updates);

complianceRuleDAO.remove = async (id) => baseDAO.removeById(db.complianceRule, id);

module.exports = complianceRuleDAO;
