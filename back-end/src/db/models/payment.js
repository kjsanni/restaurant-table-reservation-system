"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.reservation, {
        foreignKey: { allowNull: true },
        onDelete: "SET NULL",
      });
      Payment.belongsTo(models.order, {
        foreignKey: "orderId",
        onDelete: "SET NULL",
      });
      Payment.belongsTo(models.location, {
        foreignKey: "locationId",
        as: "location",
      });
    }
  }

  Payment.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reservationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM("cash", "card", "transfer", "other"),
        allowNull: false,
        defaultValue: "cash",
      },
      paidBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      splits: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
      },
      exchangeRate: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      baseAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "payment",
      indexes: [
        { fields: ["currency"] },
      ],
    }
  );

  return Payment;
};
