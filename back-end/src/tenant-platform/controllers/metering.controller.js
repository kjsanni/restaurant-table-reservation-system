const TenantMetering = require("../services/tenant-metering.service");

const getTenantMetricsHandler = async (req, res) => {
  try {
    let tenantId = req.params.tenantId ? parseInt(req.params.tenantId, 10) : req.tenant?.id;
    if (!tenantId || isNaN(tenantId)) {
      return res.status(400).json({ success: false, message: "Valid tenantId is required" });
    }
    const metrics = await TenantMetering.getTenantMetrics(tenantId);
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPlatformMetricsHandler = async (req, res) => {
  try {
    const metrics = await TenantMetering.getPlatformMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTenantMetricsHandler,
  getPlatformMetricsHandler,
};
