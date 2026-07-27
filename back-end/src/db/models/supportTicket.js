"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportTicket extends Model {
    static associate(models) {
      SupportTicket.belongsTo(models.user, {
        foreignKey: "userId",
        as: "submitter",
      });
      SupportTicket.belongsTo(models.user, {
        foreignKey: "assignedTo",
        as: "assignee",
      });
    }
  }
  SupportTicket.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      assignedTo: { type: DataTypes.INTEGER, allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      source: {
        type: DataTypes.ENUM("web", "whatsapp", "email", "phone"),
        allowNull: false,
        defaultValue: "web",
      },
      csat: { type: DataTypes.INTEGER, allowNull: true },
      firstResponseAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "supportTicket",
      tableName: "support_tickets",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["status"] },
        { fields: ["priority"] },
        { fields: ["createdAt"] },
        { fields: ["source"] },
        { fields: ["resolvedAt"] },
      ],
    }
  );
  return SupportTicket;
};
