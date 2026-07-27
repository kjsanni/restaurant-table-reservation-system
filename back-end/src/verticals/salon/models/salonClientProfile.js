"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SalonClientProfile extends Model {
    static associate(models) {
      SalonClientProfile.belongsTo(models.customer, {
        foreignKey: "customerId",
        as: "customer",
      });
      SalonClientProfile.belongsTo(models.user, {
        foreignKey: "preferredStylistId",
        as: "preferredStylist",
      });
    }
  }
  SalonClientProfile.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      hairType: {
        type: DataTypes.ENUM(
          "straight",
          "wavy",
          "curly",
          "coily",
          "locs",
          "braided",
          "short_cropped",
          "no_preference"
        ),
        allowNull: true,
      },
      preferredStylistId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paymentPreference: {
        type: DataTypes.ENUM("cash_at_salon", "card_paystack", "whatsapp_momo"),
        allowNull: true,
      },
      whatsappBookingEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      birthday: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      tier: {
        type: DataTypes.ENUM("bronze", "silver", "gold", "platinum"),
        allowNull: false,
        defaultValue: "bronze",
      },
      totalVisits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalSpent: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      noShowCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastVisitAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      lastNoShowAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "salonClientProfile",
      tableName: "salon_client_profiles",
    }
  );
  return SalonClientProfile;
};
