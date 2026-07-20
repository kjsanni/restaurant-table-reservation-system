"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const TenantOnboarding = sequelize.define(
    "tenantOnboarding",
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      steps: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "tenantOnboarding",
      tableName: "tenant_onboarding",
    }
  );

  return TenantOnboarding;
};
