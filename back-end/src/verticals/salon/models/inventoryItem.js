"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InventoryItem extends Model {
    static associate(models) {}
  }
  InventoryItem.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "pcs",
      },
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "GHS",
      },
      reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "inventoryItem",
      tableName: "inventory_items",
    }
  );
  return InventoryItem;
};
