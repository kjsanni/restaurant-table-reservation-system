const db = require("../../db/models");

const platformReportDAO = {};

platformReportDAO.create = async (payload) => {
  return await db.platformReport.create(payload);
};

platformReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.reportType) where.reportType = filters.reportType;
  if (filters.status) where.status = filters.status;
  if (filters.createdBy) where.createdBy = filters.createdBy;

  return db.platformReport.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

platformReportDAO.findById = (id) => {
  return db.platformReport.findByPk(id);
};

platformReportDAO.update = async (id, updates) => {
  const report = await platformReportDAO.findById(id);
  if (!report) return null;
  await report.update(updates);
  return report;
};

platformReportDAO.remove = async (id) => {
  const report = await platformReportDAO.findById(id);
  if (!report) return null;
  await report.destroy();
  return report;
};

module.exports = platformReportDAO;
