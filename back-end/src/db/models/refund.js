"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Refund extends Model {
    static associate(models) {}
  }

  Refund.init(
    {
      paymentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
      refundedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      idempotencyKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "refund",
      tableName: "refunds",
    }
  );

  return Refund;
};
