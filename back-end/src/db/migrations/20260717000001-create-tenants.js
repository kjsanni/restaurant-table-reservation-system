"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("tenants", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      },
      status: {
        type: Sequelize.ENUM("active", "suspended", "past_due", "cancelled", "trialing"),
        allowNull: false,
        defaultValue: "active",
      },
      plan: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "starter",
      },
      subscriptionStatus: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "active",
      },
      currentPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelAtPeriodEnd: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      graceEndsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastPaymentAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      suspendedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      suspendedReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paystackCustomerCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      paystackSubscriptionCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      paystackAuthorization: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      billingEmail: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      billingName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("tenants");
  },
};
