const OffboardingService = require("../services/offboarding.service");

const parseId = (value) => {
  const id = parseInt(value, 10);
  if (isNaN(id)) throw new Error("Invalid tenant ID");
  return id;
};

const initiateOffboardingHandler = async (req, res) => {
  try {
    const result = await OffboardingService.initiateOffboarding(parseId(req.params.id), req.user?.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const exportTenantDataHandler = async (req, res) => {
  try {
    const data = await OffboardingService.exportTenantData(parseId(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const anonymizeTenantDataHandler = async (req, res) => {
  try {
    const result = await OffboardingService.anonymizeTenantData(parseId(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteTenantDataHandler = async (req, res) => {
  try {
    const result = await OffboardingService.deleteTenantData(parseId(req.params.id));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiateOffboardingHandler,
  exportTenantDataHandler,
  anonymizeTenantDataHandler,
  deleteTenantDataHandler,
};
