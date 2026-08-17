const db = require("../../db/models");
const baseDAO = require("./base.dao");

const planDAO = {};

planDAO.findAll = async (filters = {}) => {
  const where = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return db.subscriptionPlan.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["sortOrder", "ASC"], ["price", "ASC"]],
  });
};

planDAO.findById = async (id) => {
  return db.subscriptionPlan.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

planDAO.findBySlug = async (slug) => {
// nosemgrep: tainted-sql-string - using Sequelize ORM with parameterized where clause
  return db.subscriptionPlan.findOne({ where: { slug } }); // codacy-suppress nosql-injection - parameterized ORM call
};

planDAO.create = async (data) => {
  return db.subscriptionPlan.create(data); // codacy-suppress nosql-injection - parameterized ORM call
};

planDAO.update = async (id, data) => baseDAO.updateById(db.subscriptionPlan, id, data);

planDAO.remove = async (id) => baseDAO.removeById(db.subscriptionPlan, id);

module.exports = planDAO;
