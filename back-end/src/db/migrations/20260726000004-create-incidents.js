"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("incidents", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      severity: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: Sequelize.ENUM("open", "investigating", "resolved", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      affectedTenantIds: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolvedBy: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("incidents", ["severity"]);
    await queryInterface.addIndex("incidents", ["status"]);
    await queryInterface.addIndex("incidents", ["tenantId"]);
    await queryInterface.addIndex("incidents", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("incidents");
  },
};
