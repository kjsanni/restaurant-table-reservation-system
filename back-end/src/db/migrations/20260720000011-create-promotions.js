"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Promotions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      discountType: {
        type: Sequelize.ENUM("percentage", "fixed"),
        allowNull: false,
      },
      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      minOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      maxDiscountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      usedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      validFrom: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      validUntil: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("Promotions", ["tenantId"]);
    await queryInterface.addIndex("Promotions", ["code"]);
    await queryInterface.addIndex("Promotions", ["isActive"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Promotions");
  },
};
