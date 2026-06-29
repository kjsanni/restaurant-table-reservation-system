const auditLogDAO = require("../DAOs/auditLog.dao");

const getLogsHandler = async (req, res) => {
  const logs = await auditLogDAO.getAllLogs();
  return res.status(200).json({
    success: true,
    logs,
  });
};

module.exports = {
  getLogsHandler,
};