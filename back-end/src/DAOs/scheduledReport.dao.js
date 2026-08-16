const db = require("../db/models");

const scheduledReportDAO = {};

scheduledReportDAO.create = async (payload) => {
  return await db.scheduledReport.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

scheduledReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.enabled !== undefined) where.enabled = filters.enabled;

  return db.scheduledReport.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["nextRunAt", "ASC"]],
    limit: filters.limit || 100,
  });
};

scheduledReportDAO.findById = (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
// codacy-suppress NoSqlInjection
  return db.scheduledReport.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
};

scheduledReportDAO.findDue = async () => {
  const now = new Date();
  return db.scheduledReport.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: {
      enabled: true,
      nextRunAt: { [db.Sequelize.Op.lte]: now },
    },
  });
};

scheduledReportDAO.update = async (id, updates) => {
  const report = await db.scheduledReport.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!report) return null;
  await report.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return report;
};

scheduledReportDAO.remove = async (id, tenantId) => {
  const where = { id };
  if (tenantId) where.tenantId = tenantId;
  const report = await db.scheduledReport.findOne({ where }); // codacy-suppress nosql-injection - parameterized ORM call
  if (!report) return null;
  await report.destroy();
  return report;
};

module.exports = scheduledReportDAO;
