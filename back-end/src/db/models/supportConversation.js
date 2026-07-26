"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportConversation extends Model {
    static associate(models) {
      SupportConversation.belongsTo(models.user, {
        foreignKey: "userId",
        as: "customer",
      });
      SupportConversation.belongsTo(models.user, {
        foreignKey: "assignedTo",
        as: "agent",
      });
      SupportConversation.hasMany(models.supportMessage, {
        foreignKey: "conversationId",
        as: "messages",
      });
    }
  }
  SupportConversation.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      assignedTo: { type: DataTypes.INTEGER, allowNull: true },
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
      subject: { type: DataTypes.STRING(255), allowNull: true },
      lastMessageAt: { type: DataTypes.DATE, allowNull: true },
      slaDeadline: { type: DataTypes.DATE, allowNull: true },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      csatRating: { type: DataTypes.INTEGER, allowNull: true },
      csatFeedback: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "supportConversation",
      tableName: "support_conversations",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["status"] },
        { fields: ["slaDeadline"] },
      ],
    }
  );
  return SupportConversation;
};
