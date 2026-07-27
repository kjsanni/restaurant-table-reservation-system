"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ComplianceRule extends Model {
    static associate(models) {}
  }
  ComplianceRule.init(
    {
      vertical: {
        type: DataTypes.ENUM("restaurant", "salon"),
        allowNull: false,
      },
      ruleKey: { type: DataTypes.STRING(100), allowNull: false },
      label: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      frequency: {
        type: DataTypes.ENUM("once", "monthly", "quarterly", "annually"),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "complianceRule",
      tableName: "compliance_rules",
      indexes: [
        { fields: ["vertical"] },
        { fields: ["ruleKey"] },
      ],
    }
  );
  return ComplianceRule;
};
