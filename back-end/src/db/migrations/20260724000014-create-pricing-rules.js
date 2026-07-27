"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("pricing_rules", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      ruleType: {
        type: Sequelize.ENUM("fixed_discount", "percentage_discount", "time_based", "customer_segment"),
        allowNull: false,
        defaultValue: "fixed_discount",
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      packageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "GHS",
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      weekDays: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      startTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      endTime: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      segmentKey: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      segmentValue: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: Sequelize.TEXT,
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
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("pricing_rules");
  },
};
