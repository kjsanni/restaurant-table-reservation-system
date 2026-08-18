const PlatformAnalytics = require("../services/platform-analytics.service");

const getAggregatedMetricsHandler = async (req, res) => {
  try {
    const { from, to } = req.query;
    const metrics = await PlatformAnalytics.getAggregatedMetrics({ from, to });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTenantCohortsHandler = async (req, res) => {
  try {
    const cohorts = await PlatformAnalytics.getTenantCohorts();
    res.status(200).json({ success: true, data: cohorts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPIIAuditLogHandler = async (req, res) => {
  try {
    const logs = await PlatformAnalytics.getPIIAuditLog();
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAggregatedMetricsHandler,
  getTenantCohortsHandler,
  getPIIAuditLogHandler,
};
