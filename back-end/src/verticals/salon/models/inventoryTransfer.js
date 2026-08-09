"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InventoryTransfer extends Model {
    static associate(models) {
      InventoryTransfer.belongsTo(models.tenant, { foreignKey: "tenantId" });
      InventoryTransfer.belongsTo(models.location, {
        foreignKey: "fromLocationId",
        as: "fromLocation",
      });
      InventoryTransfer.belongsTo(models.location, {
        foreignKey: "toLocationId",
        as: "toLocation",
      });
      InventoryTransfer.belongsTo(models.inventoryItem, {
        foreignKey: "inventoryItemId",
        as: "inventoryItem",
      });
    }
  }
  InventoryTransfer.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fromLocationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      toLocationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      inventoryItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 1 },
      },
      status: {
        type: DataTypes.ENUM("pending", "in_transit", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "inventoryTransfer",
      tableName: "inventory_transfers",
    }
  );
  return InventoryTransfer;
};
