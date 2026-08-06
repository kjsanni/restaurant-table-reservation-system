"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_transfers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fromLocationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "locations", key: "id" },
        onDelete: "SET NULL",
      },
      toLocationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "locations", key: "id" },
        onDelete: "SET NULL",
      },
      inventoryItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "inventory_items", key: "id" },
        onDelete: "CASCADE",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 1 },
      },
      status: {
        type: Sequelize.ENUM("pending", "in_transit", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
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
    await queryInterface.addIndex("inventory_transfers", ["tenantId"]);
    await queryInterface.addIndex("inventory_transfers", ["fromLocationId"]);
    await queryInterface.addIndex("inventory_transfers", ["toLocationId"]);
    await queryInterface.addIndex("inventory_transfers", ["inventoryItemId"]);
    await queryInterface.addIndex("inventory_transfers", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventory_transfers");
  },
};
