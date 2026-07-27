const tenantMigrationDAO = require("../DAOs/tenantMigration.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const exportTenantMigrationHandler = async (req, res) => {
  const data = await tenantMigrationDAO.exportTenant(req.params.id);
  if (!data) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  await platformAuditDAO.log(
    req.user.id,
    "tenant_migration.exported",
    "tenant",
    req.params.id,
    null,
    { exportedAt: data.exportedAt },
    req.ip
  );
  res.status(200).json({ success: true, data });
};

const importTenantMigrationHandler = async (req, res) => {
  const { targetTenantId, mode } = req.body;
  const data = await tenantMigrationDAO.importTenant(req.body.payload || req.body, {
    targetTenantId,
    mode: mode || "create",
  });
  await platformAuditDAO.log(
    req.user.id,
    "tenant_migration.imported",
    "tenant",
    targetTenantId || "new",
    null,
    { mode, results: data.results },
    req.ip
  );
  res.status(200).json({ success: true, ...data });
};

module.exports = {
  exportTenantMigrationHandler,
  importTenantMigrationHandler,
};
