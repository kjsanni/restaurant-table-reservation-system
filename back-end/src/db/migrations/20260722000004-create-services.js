"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("services", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "service_categories", key: "id" },
        onUpdate: "cascade",
        onDelete: "set null",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      durationMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
          min: 5,
        },
      },
      depositAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      bufferMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      defaultStylistId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      requiresStationType: {
        type: Sequelize.ENUM("chair", "wash", "color", "nail", "therapy"),
        allowNull: true,
      },
      whatsappBookable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("services", ["tenantId"]);
    await queryInterface.addIndex("services", ["tenantId", "categoryId"]);
    await queryInterface.addIndex("services", ["tenantId", "isAvailable"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("services");
  },
};
