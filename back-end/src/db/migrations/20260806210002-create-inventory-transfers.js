"use strict";

const inventoryTransferColumns = (Sequelize) => ({
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  ...inventoryTransferLocationColumns(Sequelize),
  ...inventoryTransferItemColumns(Sequelize),
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

const inventoryTransferLocationColumns = (Sequelize) => ({
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
});

const inventoryTransferItemColumns = (Sequelize) => ({
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
});

const createInventoryTransfersTable = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("inventory_transfers", inventoryTransferColumns(Sequelize));
};

const addInventoryTransfersIndexes = async (queryInterface) => {
  await queryInterface.addIndex("inventory_transfers", ["tenantId"]);
  await queryInterface.addIndex("inventory_transfers", ["fromLocationId"]);
  await queryInterface.addIndex("inventory_transfers", ["toLocationId"]);
  await queryInterface.addIndex("inventory_transfers", ["inventoryItemId"]);
  await queryInterface.addIndex("inventory_transfers", ["status"]);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await createInventoryTransfersTable(queryInterface, Sequelize);
    await addInventoryTransfersIndexes(queryInterface);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventory_transfers");
  },
};
