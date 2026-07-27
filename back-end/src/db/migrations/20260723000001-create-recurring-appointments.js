"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("recurring_appointments", {
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
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stylistId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      frequency: {
        type: Sequelize.ENUM("daily", "weekly", "biweekly", "monthly"),
        allowNull: false,
      },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      timeOfDay: {
        type: Sequelize.STRING(8),
        allowNull: false,
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("recurring_appointments", ["tenantId", "active"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("recurring_appointments");
  },
};
