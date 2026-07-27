"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("alert_rules", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metric: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      condition: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "gt",
      },
      threshold: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      channels: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: ["email"],
      },
      recipients: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastTriggeredAt: {
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

    await queryInterface.addIndex("alert_rules", ["metric"]);
    await queryInterface.addIndex("alert_rules", ["isActive"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("alert_rules");
  },
};
