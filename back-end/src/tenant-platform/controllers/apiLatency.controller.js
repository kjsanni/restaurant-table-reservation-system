const { getLatencyMetrics, clearLatencyMetrics } = require("../../utils/apiLatency");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const getApiLatencyHandler = async (req, res) => {
  const metrics = getLatencyMetrics();
  res.status(200).json({ success: true, data: metrics });
};

const clearApiLatencyHandler = async (req, res) => {
  clearLatencyMetrics();
  await platformAuditDAO.log(
    req.user?.id || null,
    "monitoring.api_latency_cleared",
    "system",
    null,
    null,
    {},
    req.ip
  );
  res.status(200).json({ success: true });
};

module.exports = {
  getApiLatencyHandler,
  clearApiLatencyHandler,
};
