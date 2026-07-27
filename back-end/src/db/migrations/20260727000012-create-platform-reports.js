"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("platform_reports", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      reportType: {
        type: Sequelize.ENUM("tenants", "revenue", "reservations", "orders", "payments", "support", "usage"),
        allowNull: false,
      },
      format: {
        type: Sequelize.ENUM("csv", "pdf"),
        allowNull: false,
      },
      filters: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      schedule: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "processing", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      fileUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      completedAt: {
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("platform_reports", ["reportType"]);
    await queryInterface.addIndex("platform_reports", ["status"]);
    await queryInterface.addIndex("platform_reports", ["createdBy"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("platform_reports");
  },
};
