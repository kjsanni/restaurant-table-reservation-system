const response = require("../utils/response");

const tenantMigrationStatusDAO = require("../DAOs/tenantMigrationStatus.dao");
const tenantMigrationService = require("../services/tenantMigration.service");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listTenantMigrationsHandler = async (req, res) => {
  const { tenantId } = req.params;
  const { status } = req.query;

  const records = await tenantMigrationStatusDAO.list({
    tenantId: parseInt(tenantId, 10),
    status,
    limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
  });

  res.status(200).json({ success: true, collection: records });
};

const getTenantMigrationHandler = async (req, res) => {
  const record = await tenantMigrationStatusDAO.findById(req.params.id);
  if (!record) {
    return response.notFound(res, "Migration record not found");
  }
  res.status(200).json({ success: true, item: record });
};

const getTenantMigrationStatusHandler = async (req, res) => {
  const { tenantId } = req.params;
  const status = await tenantMigrationService.getStatus(parseInt(tenantId, 10));
  res.status(200).json({ success: true, ...status });
};

const enqueueTenantMigrationHandler = async (req, res) => {
  const { tenantId } = req.params;
  const { migrationName, metadata } = req.body;

  if (!migrationName || typeof migrationName !== "string") {
    return response.badRequest(res, "migrationName is required");
  }

  const record = await tenantMigrationService.enqueue({
    tenantId: parseInt(tenantId, 10),
    migrationName,
    metadata: metadata || {},
    performedBy: req.user?.id,
    ip: req.ip,
  });

  res.status(201).json({ success: true, item: record });
};

const runTenantMigrationHandler = async (req, res) => {
  const { id } = req.params;
  const { runner } = req.body;

  if (typeof runner !== "function") {
    return response.badRequest(res, "runner function is required in request body");
  }

  const result = await tenantMigrationService.run(id, runner, req.user?.id, req.ip);
  res.status(200).json({ success: true, item: result });
};

const pauseTenantMigrationHandler = async (req, res) => {
  const { id } = req.params;
  const record = await tenantMigrationService.pause(id, req.user?.id, req.ip);
  res.status(200).json({ success: true, item: record });
};

const resumeTenantMigrationHandler = async (req, res) => {
  const { id } = req.params;
  const { runner } = req.body;

  if (typeof runner !== "function") {
    return response.badRequest(res, "runner function is required in request body");
  }

  const result = await tenantMigrationService.resume(id, runner, req.user?.id, req.ip);
  res.status(200).json({ success: true, item: result });
};

const rollbackTenantMigrationHandler = async (req, res) => {
  const { id } = req.params;
  const { rollbackRunner } = req.body;

  const record = await tenantMigrationService.rollback(id, rollbackRunner, req.user?.id, req.ip);
  res.status(200).json({ success: true, item: record });
};

module.exports = {
  listTenantMigrationsHandler,
  getTenantMigrationHandler,
  getTenantMigrationStatusHandler,
  enqueueTenantMigrationHandler,
  runTenantMigrationHandler,
  pauseTenantMigrationHandler,
  resumeTenantMigrationHandler,
  rollbackTenantMigrationHandler,
};
