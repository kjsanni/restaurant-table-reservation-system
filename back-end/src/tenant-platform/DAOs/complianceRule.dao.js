const db = require("../../db/models");

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

complianceRuleDAO.update = async (id, updates) => {
  const rule = await complianceRuleDAO.findById(id);
  if (!rule) return null;
  await rule.update(updates);
  return rule;
};

complianceRuleDAO.remove = async (id) => {
  const rule = await complianceRuleDAO.findById(id);
  if (!rule) return null;
  await rule.destroy();
  return rule;
};

module.exports = complianceRuleDAO;
