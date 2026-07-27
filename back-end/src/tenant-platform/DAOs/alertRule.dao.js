const db = require("../../db/models");

const alertRuleDAO = {};

alertRuleDAO.create = async (payload) => {
  return await db.alertRule.create(payload);
};

alertRuleDAO.list = (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.metric) where.metric = filters.metric;

  return db.alertRule.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

alertRuleDAO.findById = (id) => {
  return db.alertRule.findByPk(id);
};

alertRuleDAO.update = async (id, updates) => {
  const rule = await alertRuleDAO.findById(id);
  if (!rule) return null;
  await rule.update(updates);
  return rule;
};

alertRuleDAO.remove = async (id) => {
  const rule = await alertRuleDAO.findById(id);
  if (!rule) return null;
  await rule.destroy();
  return rule;
};

alertRuleDAO.findActive = () => {
  return db.alertRule.findAll({
    where: { isActive: true },
  });
};

module.exports = alertRuleDAO;
