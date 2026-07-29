"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const WebhookEndpoint = sequelize.define(
    "webhookEndpoint",
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      url: { type: DataTypes.STRING(500), allowNull: false },
      secret: { type: DataTypes.STRING(100), allowNull: true },
      events: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastError: { type: DataTypes.TEXT, allowNull: true },
      lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "webhookEndpoint",
      tableName: "webhook_endpoints",
    }
  );

  return WebhookEndpoint;
};
