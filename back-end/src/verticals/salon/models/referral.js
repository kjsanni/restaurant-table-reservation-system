"use strict";

const { Model } = require("sequelize");

const getReferralAttributes = (DataTypes) => ({
tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      referrerCustomerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      refereeCustomerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "cancelled", "expired"),
        allowNull: false,
        defaultValue: "pending",
      },
      rewardType: {
        type: DataTypes.ENUM("fixed_amount", "percentage", "free_service"),
        allowNull: false,
        defaultValue: "fixed_amount",
      },
      rewardValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      rewardApplied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
});

module.exports = (sequelize, DataTypes) => {
  class Referral extends Model {
    static associate(models) {
      Referral.belongsTo(models.customer, {
        foreignKey: "referrerCustomerId",
        as: "referrer",
      });
      Referral.belongsTo(models.customer, {
        foreignKey: "refereeCustomerId",
        as: "referee",
      });
      Referral.belongsTo(models.appointment, {
        foreignKey: "appointmentId",
        as: "appointment",
      });
    }
  }
  Referral.init(getReferralAttributes(DataTypes), {
    sequelize,
    modelName: "referral",
    tableName: "referrals",
  });
  return Referral;
};
