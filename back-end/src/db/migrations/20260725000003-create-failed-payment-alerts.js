"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("failed_payment_alerts", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reservationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: "GHS",
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      gateway: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "paystack",
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      lastRetriedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("open", "retrying", "resolved", "abandoned"),
        allowNull: false,
        defaultValue: "open",
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
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

    await queryInterface.addIndex("failed_payment_alerts", ["tenantId"]);
    await queryInterface.addIndex("failed_payment_alerts", ["status"]);
    await queryInterface.addIndex("failed_payment_alerts", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("failed_payment_alerts");
  },
};
