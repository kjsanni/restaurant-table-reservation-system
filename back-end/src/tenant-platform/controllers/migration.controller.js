const db = require("../../db/models");
const TenantMigrationRunner = require("../services/tenant-migration-runner.service");

const getMigrationStatusHandler = async (req, res) => {
  try {
    const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : null;
    const [applied] = await db.sequelize.query("SELECT * FROM SequelizeMeta ORDER BY name ASC");
    const appliedNames = (applied || []).map((row) => row.name);

    const fs = require("fs");
    const files = fs.readdirSync("src/db/migrations").filter((f) => f.endsWith(".js")).sort();

    if (tenantId) {
      const migrations = await TenantMigrationRunner.getMigrationsForTenant(tenantId);
      return res.status(200).json({ success: true, data: migrations });
    }

    const pending = files.filter((f) => !appliedNames.includes(f));
    const total = files.length;

    res.status(200).json({
      success: true,
      total,
      applied: appliedNames.length,
      pending: pending.length,
      pendingMigrations: pending,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch migration status", error: err.message });
  }
};

const runTenantMigrationHandler = async (req, res) => {
  try {
    const { tenantId, migrationName } = req.params;
    const result = await TenantMigrationRunner.runMigrationForTenant(parseInt(tenantId), migrationName, req.user?.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const pauseTenantMigrationHandler = async (req, res) => {
  try {
    const { tenantId, migrationName } = req.params;
    const result = await TenantMigrationRunner.pauseMigration(parseInt(tenantId), migrationName);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resumeTenantMigrationHandler = async (req, res) => {
  try {
    const { tenantId, migrationName } = req.params;
    const result = await TenantMigrationRunner.resumeMigration(parseInt(tenantId), migrationName);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const rollbackTenantMigrationHandler = async (req, res) => {
  try {
    const { tenantId, migrationName } = req.params;
    const result = await TenantMigrationRunner.rollbackMigration(parseInt(tenantId), migrationName, req.user?.id);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMigrationStatusHandler,
  runTenantMigrationHandler,
  pauseTenantMigrationHandler,
  resumeTenantMigrationHandler,
  rollbackTenantMigrationHandler,
};
