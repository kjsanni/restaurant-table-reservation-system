"use strict";

const { Model } = require("sequelize");

const getPricingRuleAttributes = (DataTypes) => ({
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  ruleType: {
    type: DataTypes.ENUM("fixed_discount", "percentage_discount", "time_based", "customer_segment"),
    allowNull: false,
    defaultValue: "fixed_discount",
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: "GHS",
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  weekDays: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  startTime: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  endTime: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  segmentKey: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  segmentValue: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = (sequelize, DataTypes) => {
  class PricingRule extends Model {
    static associate(_unused) {}
  }
  PricingRule.init(getPricingRuleAttributes(DataTypes), {
    sequelize,
    modelName: "pricingRule",
    tableName: "pricing_rules",
  });
  return PricingRule;
};
