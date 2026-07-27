"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("appointments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "customers", key: "id" },
        onUpdate: "cascade",
        onDelete: "cascade",
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "services", key: "id" },
        onUpdate: "cascade",
        onDelete: "restrict",
      },
      stationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "stations", key: "id" },
        onUpdate: "cascade",
        onDelete: "set null",
      },
      stylistId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "cascade",
        onDelete: "set null",
      },
      start: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
          "no_show"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentStatus: {
        type: Sequelize.ENUM("deposit", "partial", "paid", "unpaid"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      depositAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source: {
        type: Sequelize.ENUM("web", "whatsapp", "phone", "walkin"),
        allowNull: false,
        defaultValue: "web",
      },
      cancelledAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("appointments", ["tenantId"]);
    await queryInterface.addIndex("appointments", ["tenantId", "customerId"]);
    await queryInterface.addIndex("appointments", ["tenantId", "stylistId"]);
    await queryInterface.addIndex("appointments", ["tenantId", "stationId"]);
    await queryInterface.addIndex("appointments", ["tenantId", "status"]);
    await queryInterface.addIndex("appointments", ["tenantId", "start"]);
    await queryInterface.addIndex("appointments", ["tenantId", "paymentStatus"]);
    await queryInterface.addIndex("appointments", ["tenantId", "source"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("appointments");
  },
};
