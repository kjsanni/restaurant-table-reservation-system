"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sub_processors", {
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
        type: Sequelize.TEXT,
        allowNull: false,
      },
      dataTypes: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "under_review"),
        allowNull: false,
        defaultValue: "active",
      },
      dpaUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      privacyPolicyUrl: {
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

    await queryInterface.addIndex("sub_processors", ["status"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("sub_processors");
  },
};
