"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AlertRule extends Model {
    static associate(models) {}
  }

  AlertRule.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metric: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      condition: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "gt",
      },
      threshold: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      channels: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ["email"],
      },
      recipients: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastTriggeredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "alertRule",
      tableName: "alert_rules",
    }
  );

  return AlertRule;
};
