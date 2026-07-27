"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PlatformReferral extends Model {
    static associate(models) {
      PlatformReferral.belongsTo(models.tenant, {
        foreignKey: "referrerTenantId",
        as: "referrer",
        onDelete: "SET NULL",
      });
      PlatformReferral.belongsTo(models.tenant, {
        foreignKey: "referredTenantId",
        as: "referred",
        onDelete: "SET NULL",
      });
    }
  }

  PlatformReferral.init(
    {
      referrerTenantId: { type: DataTypes.INTEGER, allowNull: true },
      referredTenantId: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "converted", "paid"),
        allowNull: false,
        defaultValue: "pending",
      },
      rewardAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      convertedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "platformReferral",
      tableName: "platform_referrals",
    }
  );

  return PlatformReferral;
};
