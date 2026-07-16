const auditLogDAO = require("../DAOs/auditLog.dao");

const getLogsHandler = async (req, res) => {
  const { page, pageSize } = req.query;
  const result = await auditLogDAO.getAllLogs({ page, pageSize });
  return res.status(200).json({
    success: true,
    logs: result.logs,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
};

module.exports = {
  getLogsHandler,
};