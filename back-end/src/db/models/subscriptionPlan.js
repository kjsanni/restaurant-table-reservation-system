"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define(
    "subscriptionPlan",
    {
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "GHS",
      },
      maxTables: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      maxReservationsPerMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "subscriptionPlan",
      tableName: "subscription_plans",
    }
  );

  return SubscriptionPlan;
};
