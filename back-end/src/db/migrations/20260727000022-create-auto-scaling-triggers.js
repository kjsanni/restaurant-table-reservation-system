"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("auto_scaling_triggers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      metric: {
        type: Sequelize.ENUM("queue_depth", "cpu_usage", "memory_usage", "request_rate", "error_rate"),
        allowNull: false,
      },
      operator: {
        type: Sequelize.ENUM("gt", "gte", "lt", "lte", "eq"),
        allowNull: false,
      },
      threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM("scale_up", "scale_down", "alert"),
        allowNull: false,
      },
      minInstances: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      maxInstances: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cooldownMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    await queryInterface.addIndex("auto_scaling_triggers", ["metric", "isActive"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("auto_scaling_triggers");
  },
};
