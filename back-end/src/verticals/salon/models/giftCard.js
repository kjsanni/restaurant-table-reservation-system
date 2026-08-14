"use strict";

const { Model } = require("sequelize");

const getGiftCardAttributes = (DataTypes) => ({
tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "GHS",
      },
      status: {
        type: DataTypes.ENUM("active", "redeemed", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      purchasedByCustomerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      redeemedByCustomerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      redeemedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
});

module.exports = (sequelize, DataTypes) => {
  class GiftCard extends Model {
    static associate(models) {
      GiftCard.belongsTo(models.customer, {
        foreignKey: "purchasedByCustomerId",
        as: "purchasedBy",
      });
      GiftCard.belongsTo(models.customer, {
        foreignKey: "redeemedByCustomerId",
        as: "redeemedBy",
      });
    }
  }
  GiftCard.init(getGiftCardAttributes(DataTypes), {
    sequelize,
    modelName: "giftCard",
    tableName: "gift_cards",
  });
  return GiftCard;
};
