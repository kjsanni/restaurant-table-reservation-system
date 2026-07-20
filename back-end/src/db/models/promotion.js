"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Promotion extends Model {
    static associate(models) {
      Promotion.belongsTo(models.user, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }

  Promotion.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      discountType: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: false,
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      minOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      validFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "promotion",
      tableName: "Promotions",
    }
  );

  return Promotion;
};
