"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("tenant_migration_status", {
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

    await queryInterface.addIndex("tenant_migration_status", ["tenantId", "migrationName"], {
      unique: true,
      name: "uniq_tenant_migration",
    });

    await queryInterface.addIndex("tenant_migration_status", ["status"], {
      name: "idx_tenant_migration_status",
    });

    await queryInterface.addIndex("tenant_migration_status", ["tenantId"], {
      name: "idx_tenant_migration_tenant",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("tenant_migration_status");
  },
};
