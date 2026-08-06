"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const PlatformAuditLog = sequelize.define(
    "platformAuditLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      actorUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      tableName: "platform_audit_logs",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );

  PlatformAuditLog.associate = (models) => {
    PlatformAuditLog.belongsTo(models.user, {
      foreignKey: "actorUserId",
      as: "actor",
    });
    PlatformAuditLog.belongsTo(models.tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  };

  return PlatformAuditLog;
};
