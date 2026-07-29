"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("webhook_endpoints", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      secret: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      events: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastError: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastTriggeredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("webhook_endpoints");
  },
};
