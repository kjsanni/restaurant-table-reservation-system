"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("compliance_evidence", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      framework: {
        type: Sequelize.ENUM("SOC2", "ISO27001", "GDPR", "DPA2012"),
        allowNull: false,
      },
      controlId: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("not_started", "in_progress", "completed", "failed"),
        allowNull: false,
        defaultValue: "not_started",
      },
      owner: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      evidenceUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      notes: {
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

    await queryInterface.addIndex("compliance_evidence", ["framework", "status"]);
    await queryInterface.addIndex("compliance_evidence", ["controlId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("compliance_evidence");
  },
};
