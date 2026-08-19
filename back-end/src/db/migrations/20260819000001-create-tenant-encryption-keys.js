"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("tenant_encryption_keys", {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.ENUM("data_at_rest", "session", "api", "backup"),
        allowNull: false,
        defaultValue: "data_at_rest",
      },
      algorithm: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "AES-256-GCM",
      },
      status: {
        type: Sequelize.ENUM("active", "rotating", "retired"),
        allowNull: false,
        defaultValue: "active",
      },
      lastRotatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rotatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("tenant_encryption_keys", ["tenantId", "status"]);
    await queryInterface.addIndex("tenant_encryption_keys", ["tenantId", "purpose"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("tenant_encryption_keys");
  },
};
