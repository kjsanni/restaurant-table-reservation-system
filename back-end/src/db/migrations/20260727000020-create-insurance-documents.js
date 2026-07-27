"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("insurance_documents", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      insurer: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      policyNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      coverageType: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
      filePath: {
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

    await queryInterface.addIndex("insurance_documents", ["status"]);
    await queryInterface.addIndex("insurance_documents", ["expiryDate"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("insurance_documents");
  },
};
