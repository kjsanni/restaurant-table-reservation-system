const auditLogDAO = require("../DAOs/auditLog.dao");

const getLogsHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.action) filters.action = req.query.action;
  if (req.query.entityType) filters.entityType = req.query.entityType;
  if (req.query.userId) filters.userId = req.query.userId;
  if (req.query.search) filters.search = req.query.search;

  const result = await auditLogDAO.getAllLogs(filters, {
    page: req.query.page,
    pageSize: req.query.pageSize,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  });

  return res.status(200).json({
    success: true,
    logs: result.logs,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
};

const getStatsHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.action) filters.action = req.query.action;
  if (req.query.entityType) filters.entityType = req.query.entityType;

  const stats = await auditLogDAO.getLogStats(filters);
  return res.status(200).json({
    success: true,
    stats,
  });
};

const bulkDeleteHandler = async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const deleted = await auditLogDAO.bulkDeleteLogs(ids);
  return res.status(200).json({
    success: true,
    deleted,
    message: `Deleted ${deleted} audit log(s)`,
  });
};

const exportCSVHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.action) filters.action = req.query.action;
  if (req.query.entityType) filters.entityType = req.query.entityType;
  if (req.query.search) filters.search = req.query.search;

  const csv = await auditLogDAO.exportLogsCSV(filters);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
  res.send(csv);
};

const exportJSONHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.action) filters.action = req.query.action;
  if (req.query.entityType) filters.entityType = req.query.entityType;
  if (req.query.search) filters.search = req.query.search;

  const json = await auditLogDAO.exportLogsJSON(filters);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=audit-logs.json");
  res.send(json);
};

module.exports = {
  getLogsHandler,
  getStatsHandler,
  bulkDeleteHandler,
  exportCSVHandler,
  exportJSONHandler,
};
