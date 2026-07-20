const bulkDAO = require("../DAOs/bulk.dao");
const { requirePermission } = require("../../middleware/auth");

const bulkSuspendHandler = async (req, res) => {
  const { tenantIds, reason } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const count = await bulkDAO.suspendTenants(tenantIds, reason);
  res.status(200).json({ success: true, message: `Suspended ${count} tenants` });
};

const bulkChangePlanHandler = async (req, res) => {
  const { tenantIds, plan } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0 || !plan) {
    return res.status(400).json({ success: false, message: "tenantIds array and plan are required" });
  }
  const count = await bulkDAO.changePlan(tenantIds, plan);
  res.status(200).json({ success: true, message: `Updated plan for ${count} tenants` });
};

const bulkSendEmailHandler = async (req, res) => {
  const { tenantIds, subject, body } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0 || !subject || !body) {
    return res.status(400).json({ success: false, message: "tenantIds array, subject, and body are required" });
  }
  const results = await bulkDAO.sendEmail(tenantIds, subject, body);
  res.status(200).json({ success: true, results });
};

module.exports = {
  bulkSuspendHandler,
  bulkChangePlanHandler,
  bulkSendEmailHandler,
};
