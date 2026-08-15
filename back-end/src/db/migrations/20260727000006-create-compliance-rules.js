"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("compliance_rules", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vertical: {
        type: Sequelize.ENUM("restaurant", "salon", "event"),
        allowNull: false,
      },
      ruleKey: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      frequency: {
        type: Sequelize.ENUM("once", "monthly", "quarterly", "annually"),
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

    await queryInterface.addIndex("compliance_rules", ["vertical"]);
    await queryInterface.addIndex("compliance_rules", ["ruleKey"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("compliance_rules");
  },
};
