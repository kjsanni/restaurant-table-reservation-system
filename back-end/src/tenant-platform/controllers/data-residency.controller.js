const DataResidency = require("../services/data-residency.service");

const getTenantRegionHandler = async (req, res) => {
  try {
    const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : req.tenant?.id;
    const region = await DataResidency.getTenantRegion(tenantId);
    res.status(200).json({ success: true, data: region });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setTenantRegionHandler = async (req, res) => {
  try {
    const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : req.tenant?.id;
    const { region, notes } = req.body;
    const result = await DataResidency.setTenantRegion(tenantId, region, notes);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getRegionLatencyHandler = async (req, res) => {
  try {
    const { region } = req.params;
    const latency = await DataResidency.getRegionLatency(region);
    res.status(200).json({ success: true, data: latency });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const getAllRegionsHandler = async (req, res) => {
  try {
    const regions = await DataResidency.getAllRegions();
    res.status(200).json({ success: true, data: regions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTenantRegionHandler,
  setTenantRegionHandler,
  getRegionLatencyHandler,
  getAllRegionsHandler,
};
