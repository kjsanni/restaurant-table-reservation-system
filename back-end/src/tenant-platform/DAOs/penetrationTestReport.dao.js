const db = require("../../db/models");
const baseDAO = require("./base.dao");

const penetrationTestReportDAO = {};

penetrationTestReportDAO.create = async (payload) => {
  return await db.penetrationTestReport.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

penetrationTestReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return db.penetrationTestReport.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["reportDate", "DESC"]],
    limit: filters.limit || 100,
  });
};

penetrationTestReportDAO.findById = (id) => {
  return db.penetrationTestReport.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

penetrationTestReportDAO.update = async (id, updates) => baseDAO.updateById(db.penetrationTestReport, id, updates);

penetrationTestReportDAO.remove = async (id) => baseDAO.removeById(db.penetrationTestReport, id);

module.exports = penetrationTestReportDAO;
