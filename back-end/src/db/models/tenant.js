"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      Tenant.hasMany(models.user, {
        foreignKey: "tenantId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Tenant.hasMany(models.reservation, {
        foreignKey: "tenantId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Tenant.hasMany(models.customer, {
        foreignKey: "tenantId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Tenant.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      domain: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "active",
          "suspended",
          "past_due",
          "cancelled",
          "trialing"
        ),
        allowNull: false,
        defaultValue: "active",
      },
      plan: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      subscriptionStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelAtPeriodEnd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      graceEndsAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastPaymentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      suspendedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      suspendedReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paystackCustomerCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paystackSubscriptionCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paystackAuthorization: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paystackSubaccountCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paystackPublicKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paystackSecretKey: {
        type: DataTypes.STRING(100),
        allowNull: true,
        get() {
          const raw = this.getDataValue("paystackSecretKey");
          if (!raw) return raw;
          try {
            const { decrypt } = require("../../utils/encryption");
            return decrypt(raw);
          } catch {
            return raw;
          }
        },
        set(value) {
          if (!value) {
            this.setDataValue("paystackSecretKey", value);
            return;
          }
          try {
            const { encrypt } = require("../../utils/encryption");
            this.setDataValue("paystackSecretKey", encrypt(value));
          } catch {
            this.setDataValue("paystackSecretKey", value);
          }
        },
      },
      billingEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      billingName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
      },
      restaurantType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "full_service",
      },
      serviceModes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ["dine_in", "takeaway", "delivery"],
      },
      trialExtendsTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      convertedFromTrialAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "tenant",
      tableName: "tenants",
    }
  );

  return Tenant;
};
