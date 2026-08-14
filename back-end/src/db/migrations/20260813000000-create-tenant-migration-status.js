"use strict";

const TABLE = "tenant_migration_status";

const getTenantMigrationStatusColumns = (Sequelize) => ({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: "tenants", key: "id" },
    onDelete: "CASCADE",
  },
  migrationName: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM("pending", "running", "completed", "failed", "paused", "rolled_back"),
    allowNull: false,
    defaultValue: "pending",
  },
  startedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  completedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  error: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  metadata: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {},
  },
  rolledBackBy: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  rolledBackAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
  },
});

const createTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable(TABLE, getTenantMigrationStatusColumns(Sequelize));
};

const addIndexes = async (queryInterface) => {
  await queryInterface.addIndex(TABLE, ["tenantId", "migrationName"], {
    unique: true,
    name: "uniq_tenant_migration",
  });
  await queryInterface.addIndex(TABLE, ["status"], { name: "idx_tenant_migration_status" });
  await queryInterface.addIndex(TABLE, ["tenantId"], { name: "idx_tenant_migration_tenant" });
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await createTable(queryInterface, Sequelize);
    await addIndexes(queryInterface);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable(TABLE);
  },
};