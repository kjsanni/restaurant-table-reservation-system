"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("impersonation_sessions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      superAdminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tenantUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("impersonation_sessions", ["superAdminId"]);
    await queryInterface.addIndex("impersonation_sessions", ["tenantUserId"]);
    await queryInterface.addIndex("impersonation_sessions", ["token"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("impersonation_sessions");
  },
};
