"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scheduled_reports", {
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
      reportType: {
        type: Sequelize.ENUM("salon_revenue", "salon_appointments", "salon_stylists", "salon_inventory"),
        allowNull: false,
      },
      format: {
        type: Sequelize.ENUM("csv"),
        allowNull: false,
        defaultValue: "csv",
      },
      filters: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      frequency: {
        type: Sequelize.ENUM("daily", "weekly", "monthly"),
        allowNull: false,
      },
      frequencyDay: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      frequencyTime: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: "08:00",
      },
      recipients: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      nextRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
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

    await queryInterface.addIndex("scheduled_reports", ["tenantId"]);
    await queryInterface.addIndex("scheduled_reports", ["nextRunAt"]);
    await queryInterface.addIndex("scheduled_reports", ["enabled"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("scheduled_reports");
  },
};
