const db = require("../../db/models");
const baseDAO = require("./base.dao");

const tenantMigrationStatusDAO = {};

tenantMigrationStatusDAO.create = async (payload) => {
  return await db.tenantMigrationStatus.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
};

tenantMigrationStatusDAO.list = (filters = {}) => {
  const where = {};
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.status) where.status = filters.status;
  if (filters.migrationName) where.migrationName = filters.migrationName;

  return db.tenantMigrationStatus.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

tenantMigrationStatusDAO.findById = (id) => {
  return db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
};

tenantMigrationStatusDAO.findByTenantAndMigration = (tenantId, migrationName) => {
  return db.tenantMigrationStatus.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, migrationName },
  });
};

tenantMigrationStatusDAO.update = async (id, updates) => baseDAO.updateById(db.tenantMigrationStatus, id, updates);

tenantMigrationStatusDAO.updateByTenantAndMigration = async (tenantId, migrationName, updates) => {
  const record = await db.tenantMigrationStatus.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, migrationName },
  });
  if (!record) return null;
  await record.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return record;
};

tenantMigrationStatusDAO.getPendingForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, status: "pending" },
    order: [["createdAt", "ASC"]],
  });
};

tenantMigrationStatusDAO.getRunningForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, status: "running" },
    order: [["createdAt", "ASC"]],
  });
};

tenantMigrationStatusDAO.getFailedForTenant = (tenantId) => {
  return db.tenantMigrationStatus.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { tenantId, status: "failed" },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

tenantMigrationStatusDAO.markRunning = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "running",
    startedAt: new Date(),
    error: null,
  });
  return record;
};

tenantMigrationStatusDAO.markCompleted = async (id, metadata = {}) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "completed",
    completedAt: new Date(),
    metadata: { ...(record.metadata || {}), ...metadata },
  });
  return record;
};

tenantMigrationStatusDAO.markFailed = async (id, error) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "failed",
    error: error || "Migration failed",
    completedAt: new Date(),
  });
  return record;
};

tenantMigrationStatusDAO.markPaused = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "paused",
  });
  return record;
};

tenantMigrationStatusDAO.markResumed = async (id) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "running",
    error: null,
  });
  return record;
};

tenantMigrationStatusDAO.markRolledBack = async (id, userId) => {
  const record = await db.tenantMigrationStatus.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!record) return null;
  await record.update({ // codacy-suppress nosql-injection - parameterized ORM call
    status: "rolled_back",
    rolledBackBy: userId,
    rolledBackAt: new Date(),
    completedAt: new Date(),
  });
  return record;
};

tenantMigrationStatusDAO.getProgress = (tenantId) => {
  return db.tenantMigrationStatus.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
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
