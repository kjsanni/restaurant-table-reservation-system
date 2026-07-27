"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Incident extends Model {
    static associate(models) {
      Incident.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        as: "tenant",
      });
      Incident.belongsTo(models.user, {
        foreignKey: "resolvedBy",
        as: "resolver",
      });
    }
  }
  Incident.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      severity: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM("open", "investigating", "resolved", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      affectedTenantIds: { type: DataTypes.JSON, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "incident",
      tableName: "incidents",
      indexes: [{ fields: ["severity"] }, { fields: ["status"] }, { fields: ["tenantId"] }, { fields: ["createdAt"] }],
    }
  );
  return Incident;
};
