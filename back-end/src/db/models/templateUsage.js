"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TemplateUsage extends Model {
    static associate(models) {
    }
  }

  TemplateUsage.init(
    {
      templateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      appliedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      source: {
        type: DataTypes.ENUM("tenant_creation", "manual_apply"),
        allowNull: false,
        defaultValue: "manual_apply",
      },
      appliedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "templateUsage",
      tableName: "template_usage",
      createdAt: true,
      updatedAt: false,
    }
  );

  return TemplateUsage;
};
