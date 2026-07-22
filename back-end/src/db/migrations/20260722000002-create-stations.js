"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("stations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("chair", "wash", "color", "nail", "therapy"),
        allowNull: false,
        defaultValue: "chair",
      },
      zone: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 1,
        },
      },
      isOccupied: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isBlocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      floorPlanId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      maintenanceNotes: {
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

    await queryInterface.addIndex("stations", ["tenantId"]);
    await queryInterface.addIndex("stations", ["tenantId", "type"]);
    await queryInterface.addIndex("stations", ["tenantId", "isOccupied"]);
    await queryInterface.addIndex("stations", ["tenantId", "isBlocked"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("stations");
  },
};
