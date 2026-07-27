const db = require("../../db/models");

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

penetrationTestReportDAO.update = async (id, updates) => {
  const report = await penetrationTestReportDAO.findById(id);
  if (!report) return null;
  await report.update(updates);
  return report;
};

penetrationTestReportDAO.remove = async (id) => {
  const report = await penetrationTestReportDAO.findById(id);
  if (!report) return null;
  await report.destroy();
  return report;
};

module.exports = penetrationTestReportDAO;
