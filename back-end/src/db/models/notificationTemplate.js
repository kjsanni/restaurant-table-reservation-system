"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class NotificationTemplate extends Model {
    static associate(models) {}
  }
  NotificationTemplate.init(
    {
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      channel: {
        type: DataTypes.ENUM("email", "sms", "push", "in_app"),
        allowNull: false,
      },
      subject: { type: DataTypes.STRING(255), allowNull: true },
      body: { type: DataTypes.TEXT, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "notificationTemplate",
      tableName: "notification_templates",
      indexes: [
        { fields: ["key"] },
        { fields: ["channel"] },
      ],
    }
  );
  return NotificationTemplate;
};
