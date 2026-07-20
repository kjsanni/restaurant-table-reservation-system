"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.customer, {
        foreignKey: "customerId",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        hooks: true,
      });
      Order.belongsTo(models.reservation, {
        foreignKey: "reservationId",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        hooks: true,
      });
      Order.hasMany(models.orderItem, {
        foreignKey: "orderId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
    }
  }
  Order.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reservationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "draft",
          "submitted",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "draft",
      },
      paymentStatus: {
        type: DataTypes.ENUM("unpaid", "deposit", "partial", "paid", "refunded"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      orderedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      discountType: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: true,
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      discountCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "order",
      tableName: "Orders",
    }
  );
  return Order;
};
