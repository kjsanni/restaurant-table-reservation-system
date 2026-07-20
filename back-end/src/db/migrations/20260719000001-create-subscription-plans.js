"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("subscription_plans", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
      },
      maxTables: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      maxReservationsPerMonth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 500,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex("subscription_plans", ["slug"], { unique: true });
    await queryInterface.addIndex("subscription_plans", ["isActive", "sortOrder"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("subscription_plans");
  },
};
