"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const TenantEncryptionKey = sequelize.define(
    "tenantEncryptionKey",
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      purpose: {
        type: DataTypes.ENUM("data_at_rest", "session", "api", "backup"),
        allowNull: false,
        defaultValue: "data_at_rest",
      },
      algorithm: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "AES-256-GCM",
      },
      status: {
        type: DataTypes.ENUM("active", "rotating", "retired"),
        allowNull: false,
        defaultValue: "active",
      },
      lastRotatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rotatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "tenantEncryptionKey",
      tableName: "tenant_encryption_keys",
    }
  );

  return TenantEncryptionKey;
};
