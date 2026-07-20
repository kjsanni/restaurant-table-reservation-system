"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const PlatformAuditLog = sequelize.define(
    "platformAuditLog",
    {
      actorUserId: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING(100), allowNull: false },
      entityType: { type: DataTypes.STRING(50), allowNull: true },
      entityId: { type: DataTypes.INTEGER, allowNull: true },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
      ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    },
    {
      sequelize,
      modelName: "platformAuditLog",
      tableName: "platform_audit_logs",
      timestamps: false,
    }
  );

  return PlatformAuditLog;
};
