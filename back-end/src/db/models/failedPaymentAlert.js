"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FailedPaymentAlert extends Model {
    static associate(models) {
      FailedPaymentAlert.belongsTo(models.reservation, {
        foreignKey: "reservationId",
        allowNull: true,
      });
    }
  }
  FailedPaymentAlert.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      reservationId: { type: DataTypes.INTEGER, allowNull: true },
      reference: { type: DataTypes.STRING(100), allowNull: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: true, defaultValue: "GHS" },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      gateway: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "paystack" },
      retryCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      maxRetries: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
      lastRetriedAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("open", "retrying", "resolved", "abandoned"),
        allowNull: false,
        defaultValue: "open",
      },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    },
    {
      sequelize,
      modelName: "failedPaymentAlert",
      tableName: "failed_payment_alerts",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["status"] },
        { fields: ["createdAt"] },
      ],
    }
  );
  return FailedPaymentAlert;
};
