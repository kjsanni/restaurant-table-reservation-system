const bulkDAO = require("../DAOs/bulk.dao");
const { requirePermission } = require("../../middleware/auth");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

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

const bulkChangeVerticalHandler = async (req, res) => {
  const { tenantIds, businessVertical } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0 || !businessVertical) {
    return res.status(400).json({ success: false, message: "tenantIds array and businessVertical are required" });
  }
  const updated = await bulkDAO.changeVertical(tenantIds, businessVertical);
  for (const item of updated) {
    await platformAuditDAO.log(
      req.user?.id || null,
      "tenant.vertical.changed",
      "tenant",
      item.id,
      item.id,
      { businessVertical, tenantName: item.name },
      req.ip
    );
  }
  res.status(200).json({ success: true, message: `Updated vertical for ${updated.length} tenants`, items: updated });
};

const bulkEnableHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const count = await bulkDAO.enableTenants(tenantIds);
  res.status(200).json({ success: true, message: `Re-enabled ${count} tenants` });
};

const bulkExportHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const data = await bulkDAO.exportTenants(tenantIds);
  res.status(200).json({ success: true, collection: data });
};

const bulkAssignFeatureFlagsHandler = async (req, res) => {
  const { tenantIds, featureFlags } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0 || !featureFlags || typeof featureFlags !== "object") {
    return res.status(400).json({ success: false, message: "tenantIds array and featureFlags object are required" });
  }
  const count = await bulkDAO.assignFeatureFlags(tenantIds, featureFlags);
  res.status(200).json({ success: true, message: `Updated feature flags for ${count} tenants` });
};

const bulkDeleteHandler = async (req, res) => {
  const { tenantIds } = req.body;
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ success: false, message: "tenantIds array is required" });
  }
  const count = await bulkDAO.deleteTenants(tenantIds);
  res.status(200).json({ success: true, message: `Deleted ${count} tenants` });
};

module.exports = {
  bulkSuspendHandler,
  bulkChangePlanHandler,
  bulkSendEmailHandler,
  bulkChangeVerticalHandler,
  bulkEnableHandler,
  bulkExportHandler,
  bulkAssignFeatureFlagsHandler,
  bulkDeleteHandler,
};
