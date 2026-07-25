"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("backup_records", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM("full", "incremental", "snapshot"),
        allowNull: false,
        defaultValue: "full",
      },
      status: {
        type: Sequelize.ENUM("pending", "running", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      sizeBytes: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      storagePath: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
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

    await queryInterface.addIndex("backup_records", ["status"]);
    await queryInterface.addIndex("backup_records", ["createdAt"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("backup_records");
  },
};
