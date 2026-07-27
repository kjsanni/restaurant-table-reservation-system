"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AutoScalingTrigger extends Model {
    static associate(models) {}
  }
  AutoScalingTrigger.init(
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      metric: {
        type: DataTypes.ENUM("queue_depth", "cpu_usage", "memory_usage", "request_rate", "error_rate"),
        allowNull: false,
      },
      operator: {
        type: DataTypes.ENUM("gt", "gte", "lt", "lte", "eq"),
        allowNull: false,
      },
      threshold: { type: DataTypes.FLOAT, allowNull: false },
      action: {
        type: DataTypes.ENUM("scale_up", "scale_down", "alert"),
        allowNull: false,
      },
      minInstances: { type: DataTypes.INTEGER, allowNull: true },
      maxInstances: { type: DataTypes.INTEGER, allowNull: true },
      cooldownMinutes: { type: DataTypes.INTEGER, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "autoScalingTrigger",
      tableName: "auto_scaling_triggers",
      indexes: [{ fields: ["metric", "isActive"] }],
    }
  );
  return AutoScalingTrigger;
};
