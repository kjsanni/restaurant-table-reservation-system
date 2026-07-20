const db = require("../../db/models");

const planDAO = {};

planDAO.findAll = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.subscriptionPlan.findAll({
    where,
    order: [["sortOrder", "ASC"], ["price", "ASC"]],
  });
};

planDAO.findById = async (id) => {
  return db.subscriptionPlan.findByPk(id);
};

planDAO.findBySlug = async (slug) => {
  return db.subscriptionPlan.findOne({ where: { slug } });
};

planDAO.create = async (data) => {
  return db.subscriptionPlan.create(data);
};

planDAO.update = async (id, data) => {
  const plan = await db.subscriptionPlan.findByPk(id);
  if (!plan) return null;
  await plan.update(data);
  return plan;
};

planDAO.remove = async (id) => {
  const plan = await db.subscriptionPlan.findByPk(id);
  if (!plan) return null;
  await plan.destroy();
  return plan;
};

module.exports = planDAO;
