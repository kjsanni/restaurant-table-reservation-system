const dataAnonymizationDAO = require("../DAOs/dataAnonymization.dao");

const dataAnonymizationController = {};

dataAnonymizationController.anonymizeTenantHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  if (!tenantId) {
    return res.status(400).json({ success: false, message: "tenantId is required" });
  }

  const result = await dataAnonymizationDAO.anonymizeTenant(tenantId, req.user.id);
  res.status(200).json({ success: true, ...result });
};

module.exports = dataAnonymizationController;
