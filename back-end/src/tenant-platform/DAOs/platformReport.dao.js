const db = require("../../db/models");
const baseDAO = require("./base.dao");

const platformReportDAO = {};

platformReportDAO.create = async (payload) => {
  return await db.platformReport.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

platformReportDAO.list = (filters = {}) => {
  const where = {};
  if (filters.reportType) where.reportType = filters.reportType;
  if (filters.status) where.status = filters.status;
  if (filters.createdBy) where.createdBy = filters.createdBy;

  return db.platformReport.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

platformReportDAO.findById = (id) => {
  return db.platformReport.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

platformReportDAO.update = async (id, updates) => baseDAO.updateById(db.platformReport, id, updates);

platformReportDAO.remove = async (id) => baseDAO.removeById(db.platformReport, id);

module.exports = platformReportDAO;
