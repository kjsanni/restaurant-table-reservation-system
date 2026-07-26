"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("data_retention_policies", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      dataCategory: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      retentionDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM("delete", "anonymize", "archive"),
        allowNull: false,
        defaultValue: "delete",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      lastRunResult: {
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

    await queryInterface.addIndex("data_retention_policies", ["dataCategory"]);
    await queryInterface.addIndex("data_retention_policies", ["isActive"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("data_retention_policies");
  },
};
