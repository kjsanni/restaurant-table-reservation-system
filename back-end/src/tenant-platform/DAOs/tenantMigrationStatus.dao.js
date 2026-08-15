const db = require("../../db/models");

const tenantMigrationStatusDAO = {};

tenantMigrationStatusDAO.create = async (payload) => {
  return await db.tenantMigrationStatus.create(payload);
};

tenantMigrationStatusDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.migrationName) where.migrationName = filters.migrationName;

  return db.tenantMigrationStatus.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

tenantMigrationStatusDAO.findById = (id) => {
  return db.tenantMigrationStatus.findByPk(id);
};

tenantMigrationStatusDAO.findByTenantAndMigration = (tenantId, migrationName) => {
  return db.tenantMigrationStatus.findOne({
    where: { tenantId, migrationName },
  });
};

tenantMigrationStatusDAO.update = async (id, updates) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update(updates);
  return record;
};

tenantMigrationStatusDAO.updateByTenantAndMigration = async (tenantId, migrationName, updates) => {
  const record = await db.tenantMigrationStatus.findOne({
    where: { tenantId, migrationName },
  });
  if (!record) return null;
  await record.update(updates);
  return record;
};

tenantMigrationStatusDAO.getPendingForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({
    where: { tenantId, status: "pending" },
    order: [["createdAt", "ASC"]],
  });
};

tenantMigrationStatusDAO.getRunningForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({
    where: { tenantId, status: "running" },
    order: [["createdAt", "ASC"]],
  });
};

tenantMigrationStatusDAO.getFailedForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({
    where: { tenantId, status: "failed" },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

tenantMigrationStatusDAO.markRunning = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "running",
    startedAt: new Date(),
    error: null,
  });
  return record;
};

tenantMigrationStatusDAO.markCompleted = async (id, metadata = {}) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "completed",
    completedAt: new Date(),
    metadata: { ...(record.metadata || {}), ...metadata },
  });
  return record;
};

tenantMigrationStatusDAO.markFailed = async (id, error) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "failed",
    error: error || "Migration failed",
    completedAt: new Date(),
  });
  return record;
};

tenantMigrationStatusDAO.markPaused = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "paused",
  });
  return record;
};

tenantMigrationStatusDAO.markResumed = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "running",
    error: null,
  });
  return record;
};

tenantMigrationStatusDAO.markRolledBack = async (id, userId) => {
  const record = await db.tenantMigrationStatus.findByPk(id);
  if (!record) return null;
  await record.update({
    status: "rolled_back",
    rolledBackBy: userId,
    rolledBackAt: new Date(),
    completedAt: new Date(),
  });
  return record;
};

tenantMigrationStatusDAO.getProgress = (tenantId) => {
  return db.tenantMigrationStatus.findAll({
    where: { tenantId },
    attributes: [
      "status",
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });
};

module.exports = tenantMigrationStatusDAO;
