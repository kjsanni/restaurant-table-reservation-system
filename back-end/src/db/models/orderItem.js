"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.order, {
        foreignKey: "orderId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
      OrderItem.belongsTo(models.menuItem, {
        foreignKey: "menuItemId",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        hooks: true,
      });
    }
  }
  OrderItem.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      selectedOptions: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      itemNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lineTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "orderItem",
      tableName: "OrderItems",
    }
  );
  return OrderItem;
};
