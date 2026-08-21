"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("loyalty_transactions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "manual",
      },
      balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("loyalty_transactions", ["customerId"]);
    await queryInterface.addIndex("loyalty_transactions", ["tenantId"]);
    await queryInterface.addIndex("loyalty_transactions", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("loyalty_transactions");
  },
};
