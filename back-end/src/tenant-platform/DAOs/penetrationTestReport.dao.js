const db = require("../../db/models");
const baseDAO = require("./base.dao");

const penetrationTestReportDAO = {};

penetrationTestReportDAO.create = async (payload) => {
  return await db.penetrationTestReport.create(payload);
};

penetrationTestReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;

  return db.penetrationTestReport.findAll({
    where,
    order: [["reportDate", "DESC"]],
    limit: filters.limit || 100,
  });
};

penetrationTestReportDAO.findById = (id) => {
  return db.penetrationTestReport.findByPk(id);
};

penetrationTestReportDAO.update = async (id, updates) => baseDAO.updateById(db.penetrationTestReport, id, updates);

penetrationTestReportDAO.remove = async (id) => baseDAO.removeById(db.penetrationTestReport, id);

module.exports = penetrationTestReportDAO;
