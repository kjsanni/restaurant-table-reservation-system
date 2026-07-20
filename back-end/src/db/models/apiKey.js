"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define(
    "apiKey",
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      keyHash: { type: DataTypes.STRING(255), allowNull: false },
      last4: { type: DataTypes.STRING(4), allowNull: false },
      scopes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      lastUsedAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "apiKey",
      tableName: "api_keys",
    }
  );

  return ApiKey;
};
