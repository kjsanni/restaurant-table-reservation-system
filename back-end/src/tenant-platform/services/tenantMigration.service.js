"use strict";

const tenantMigrationStatusDAO = require("../DAOs/tenantMigrationStatus.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const STATUS_TRANSITIONS = {
  pending: ["running", "paused", "failed"],
  running: ["completed", "failed", "paused"],
  paused: ["running", "failed"],
  failed: ["running", "paused"],
  completed: [],
  rolled_back: [],
};

const isValidTransition = (from, to) => {
  return STATUS_TRANSITIONS[from]?.includes(to) || false;
};

const tenantMigrationService = {};

tenantMigrationService.enqueue = async ({ tenantId, migrationName, metadata = {}, performedBy, ip }) => {
  const existing = await tenantMigrationStatusDAO.findByTenantAndMigration(tenantId, migrationName);
  if (existing && existing.status !== "rolled_back") {
    return existing;
  }

  if (existing && existing.status === "rolled_back") {
    const record = await tenantMigrationStatusDAO.updateByTenantAndMigration(tenantId, migrationName, {
      status: "pending",
      startedAt: null,
      completedAt: null,
      error: null,
      rolledBackBy: null,
      rolledBackAt: null,
      metadata: { ...(existing.metadata || {}), ...metadata, reEnqueuedAt: new Date().toISOString() },
    });
    if (record) {
      await platformAuditDAO.log(performedBy, "migration.reenqueued", "tenant_migration", record.id, null, { tenantId, migrationName }, ip);
    }
    return record;
  }

  const record = await tenantMigrationStatusDAO.create({
    tenantId,
    migrationName,
    status: "pending",
    metadata,
  });

  await platformAuditDAO.log(performedBy, "migration.enqueued", "tenant_migration", record.id, null, { tenantId, migrationName }, ip);

  return record;
};

tenantMigrationService.run = async (id, runner, performedBy, ip) => {
  const record = await tenantMigrationStatusDAO.findById(id);
  if (!record) {
    throw { status: 404, message: "Migration record not found" };
  }

  if (!isValidTransition(record.status, "running")) {
    throw { status: 409, message: `Cannot run migration from status: ${record.status}` };
  }

  await tenantMigrationStatusDAO.markRunning(id);

  await platformAuditDAO.log(performedBy, "migration.started", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName }, ip);

  try {
    const result = await runner(record);

    if (result.paused) {
      await tenantMigrationStatusDAO.markPaused(id);
      await platformAuditDAO.log(performedBy, "migration.paused", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, progress: result.progress }, ip);
      return { ...record.toJSON(), paused: true, progress: result.progress };
    }

    await tenantMigrationStatusDAO.markCompleted(id, result.metadata || {});
    await platformAuditDAO.log(performedBy, "migration.completed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, result }, ip);
    return { ...(await tenantMigrationStatusDAO.findById(id)).toJSON(), result };
  } catch (err) {
    await tenantMigrationStatusDAO.markFailed(id, err.message || "Migration failed");
    await platformAuditDAO.log(performedBy, "migration.failed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, error: err.message }, ip);
    throw err;
  }
};

tenantMigrationService.pause = async (id, performedBy, ip) => {
  const record = await tenantMigrationStatusDAO.findById(id);
  if (!record) {
    throw { status: 404, message: "Migration record not found" };
  }

  if (record.status !== "running") {
    throw { status: 409, message: `Cannot pause migration from status: ${record.status}` };
  }

  const updated = await tenantMigrationStatusDAO.markPaused(id);
  await platformAuditDAO.log(performedBy, "migration.paused", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName }, ip);
  return updated;
};

tenantMigrationService.resume = async (id, runner, performedBy, ip) => {
  const record = await tenantMigrationStatusDAO.findById(id);
  if (!record) {
    throw { status: 404, message: "Migration record not found" };
  }

  if (!isValidTransition(record.status, "running")) {
    throw { status: 409, message: `Cannot resume migration from status: ${record.status}` };
  }

  await tenantMigrationStatusDAO.markResumed(id);
  await platformAuditDAO.log(performedBy, "migration.resumed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName }, ip);

  try {
    const result = await runner(record);

    if (result.paused) {
      await tenantMigrationStatusDAO.markPaused(id);
      await platformAuditDAO.log(performedBy, "migration.paused", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, progress: result.progress }, ip);
      return { ...record.toJSON(), paused: true, progress: result.progress };
    }

    await tenantMigrationStatusDAO.markCompleted(id, result.metadata || {});
    await platformAuditDAO.log(performedBy, "migration.completed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, result }, ip);
    return { ...(await tenantMigrationStatusDAO.findById(id)).toJSON(), result };
  } catch (err) {
    await tenantMigrationStatusDAO.markFailed(id, err.message || "Migration failed");
    await platformAuditDAO.log(performedBy, "migration.failed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, error: err.message }, ip);
    throw err;
  }
};

tenantMigrationService.rollback = async (id, rollbackRunner, performedBy, ip) => {
  const record = await tenantMigrationStatusDAO.findById(id);
  if (!record) {
    throw { status: 404, message: "Migration record not found" };
  }

  if (!["completed", "failed"].includes(record.status)) {
    throw { status: 409, message: `Cannot rollback migration from status: ${record.status}` };
  }

  if (rollbackRunner) {
    try {
      await rollbackRunner(record);
    } catch (err) {
      await platformAuditDAO.log(performedBy, "migration.rollback_failed", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName, error: err.message }, ip);
      throw { status: 500, message: `Rollback failed: ${err.message}` };
    }
  }

  const updated = await tenantMigrationStatusDAO.markRolledBack(id, performedBy);
  await platformAuditDAO.log(performedBy, "migration.rolled_back", "tenant_migration", id, null, { tenantId: record.tenantId, migrationName: record.migrationName }, ip);
  return updated;
};

const toJSON = (record) => (typeof record?.toJSON === "function" ? record.toJSON() : record);

tenantMigrationService.getStatus = async (tenantId) => {
  const pending = await tenantMigrationStatusDAO.getPendingForTenant(tenantId);
  const running = await tenantMigrationStatusDAO.getRunningForTenant(tenantId);
  const failed = await tenantMigrationStatusDAO.getFailedForTenant(tenantId);
  const progress = await tenantMigrationStatusDAO.getProgress(tenantId);

  return {
    pending: pending.map(toJSON),
    running: running.map(toJSON),
    failed: failed.map(toJSON),
    progress,
  };
};

module.exports = tenantMigrationService;
