"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LoyaltyTransaction extends Model {
    static associate(models) {
      if (models.customer) {
        LoyaltyTransaction.belongsTo(models.customer, { foreignKey: "customerId", onDelete: "CASCADE" });
      }
      if (models.tenant) {
        LoyaltyTransaction.belongsTo(models.tenant, { foreignKey: "tenantId", onDelete: "SET NULL" });
      }
    }
  }

  LoyaltyTransaction.init(
    {
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      points: { type: DataTypes.INTEGER, allowNull: false },
      source: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "manual" },
      balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      metadata: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "loyaltyTransaction",
      tableName: "loyalty_transactions",
      indexes: [
        { fields: ["customerId"] },
        { fields: ["tenantId"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return LoyaltyTransaction;
};
