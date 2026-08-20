const { getLatencyMetrics, clearLatencyMetrics } = require("../../utils/apiLatency");
const auditLog = require("../utils/auditLog");

const getApiLatencyHandler = async (req, res) => {
  const metrics = getLatencyMetrics();
  res.status(200).json({ success: true, data: metrics });
};

const clearApiLatencyHandler = async (req, res) => {
  clearLatencyMetrics();
  await auditLog(req, "monitoring.api_latency_cleared", "system", null, {});
  res.status(200).json({ success: true });
};

module.exports = {
  getApiLatencyHandler,
  clearApiLatencyHandler,
};
