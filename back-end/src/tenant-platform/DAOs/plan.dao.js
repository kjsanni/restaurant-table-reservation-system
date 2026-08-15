const db = require("../../db/models");
const baseDAO = require("./base.dao");

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
// nosemgrep: tainted-sql-string - using Sequelize ORM with parameterized where clause
  return db.subscriptionPlan.findOne({ where: { slug } });
};

planDAO.create = async (data) => {
  return db.subscriptionPlan.create(data);
};

planDAO.update = async (id, data) => baseDAO.updateById(db.subscriptionPlan, id, data);

planDAO.remove = async (id) => baseDAO.removeById(db.subscriptionPlan, id);

module.exports = planDAO;
