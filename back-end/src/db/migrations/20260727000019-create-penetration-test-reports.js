"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("penetration_test_reports", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      tester: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      reportDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("draft", "submitted", "reviewed", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      findings: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      remediation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      filePath: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex("penetration_test_reports", ["status"]);
    await queryInterface.addIndex("penetration_test_reports", ["reportDate"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("penetration_test_reports");
  },
};
