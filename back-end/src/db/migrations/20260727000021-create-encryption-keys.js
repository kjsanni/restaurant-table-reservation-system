"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("encryption_keys", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.ENUM("data_at_rest", "session", "api", "backup"),
        allowNull: false,
      },
      algorithm: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "AES-256-GCM",
      },
      status: {
        type: Sequelize.ENUM("active", "rotating", "retired"),
        allowNull: false,
        defaultValue: "active",
      },
      lastRotatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rotatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("encryption_keys", ["status"]);
    await queryInterface.addIndex("encryption_keys", ["purpose"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("encryption_keys");
  },
};
