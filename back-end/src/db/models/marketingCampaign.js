"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MarketingCampaign extends Model {
    static associate(models) {}
  }

  MarketingCampaign.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("email", "whatsapp", "social", "sms"),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(180),
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      targetAudience: {
        type: DataTypes.ENUM("all", "vip", "new", "inactive"),
        allowNull: false,
        defaultValue: "all",
      },
      status: {
        type: DataTypes.ENUM("draft", "scheduled", "sent", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      recipients: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "marketingCampaign",
      tableName: "marketing_campaigns",
    }
  );

  return MarketingCampaign;
};
