const response = require("../utils/response");

const { getEventUsage } = require("../services/planLimits.service");
const { checkOverageAlerts, getTenantAlerts } = require("../services/usageAlert.service");

const getTenantUsageWithEventLimitsHandler = async (req, res) => {
  const data = await getEventUsage(req.params.id);
  if (!data) {
    return response.notFound(res, "Tenant not found");
  }
  res.status(200).json({ success: true, item: data });
};

const checkOverageAlertsHandler = async (req, res) => {
  const results = await checkOverageAlerts();
  res.status(200).json({ success: true, alertsCreated: results.length, results });
};

const getTenantAlertsHandler = async (req, res) => {
  const alerts = await getTenantAlerts(req.params.id);
  res.status(200).json({ success: true, collection: alerts });
};

module.exports = {
  getTenantUsageWithEventLimitsHandler,
  checkOverageAlertsHandler,
  getTenantAlertsHandler,
};
