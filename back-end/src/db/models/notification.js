"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "notification",
    {
      userId: { type: DataTypes.INTEGER, allowNull: true },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      type: { type: DataTypes.STRING(50), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: true },
      data: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "notification",
      tableName: "notifications",
      timestamps: false,
    }
  );

  return Notification;
};
