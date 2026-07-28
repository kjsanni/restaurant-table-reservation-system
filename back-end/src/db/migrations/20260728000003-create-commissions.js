"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("commissions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      appointmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      rateType: {
        type: Sequelize.ENUM("percentage", "fixed"),
        allowNull: false,
        defaultValue: "percentage",
      },
      rateValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "paid", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
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

    await queryInterface.addIndex("commissions", ["tenantId", "userId", "status"]);
    await queryInterface.addIndex("commissions", ["tenantId", "appointmentId"]);
    await queryInterface.addIndex("commissions", ["tenantId", "serviceId"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("commissions");
  },
};
