const db = require("../db/models");

const scheduledReportDAO = {};

scheduledReportDAO.create = async (payload) => {
  return await db.scheduledReport.create(payload);
};

scheduledReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.enabled !== undefined) where.enabled = filters.enabled;

  return db.scheduledReport.findAll({
    where,
    order: [["nextRunAt", "ASC"]],
    limit: filters.limit || 100,
  });
};

scheduledReportDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.scheduledReport.findOne({ where });
};

scheduledReportDAO.findDue = async () => {
  const now = new Date();
  return db.scheduledReport.findAll({
    where: {
      enabled: true,
      nextRunAt: { [db.Sequelize.Op.lte]: now },
    },
  });
};

scheduledReportDAO.update = async (id, updates) => {
  const report = await db.scheduledReport.findByPk(id);
  if (!report) return null;
  await report.update(updates);
  return report;
};

scheduledReportDAO.remove = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const report = await db.scheduledReport.findOne({ where });
  if (!report) return null;
  await report.destroy();
  return report;
};

module.exports = scheduledReportDAO;
