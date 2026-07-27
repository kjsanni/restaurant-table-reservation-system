"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    static associate(models) {}
  }
  Announcement.init(
    {
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      channel: {
        type: DataTypes.ENUM("email", "sms", "push", "in_app", "all"),
        allowNull: false,
        defaultValue: "all",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "announcement",
      tableName: "announcements",
      indexes: [
        { fields: ["isActive"] },
        { fields: ["channel"] },
      ],
    }
  );
  return Announcement;
};
