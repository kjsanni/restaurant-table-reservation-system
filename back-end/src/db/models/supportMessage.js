"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportMessage extends Model {
    static associate(models) {}
  }
  SupportMessage.init(
    {
      conversationId: { type: DataTypes.INTEGER, allowNull: false },
      senderId: { type: DataTypes.INTEGER, allowNull: true },
      senderType: {
        type: DataTypes.ENUM("customer", "agent", "system"),
        allowNull: false,
        defaultValue: "customer",
      },
      body: { type: DataTypes.TEXT, allowNull: false },
      metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    },
    {
      sequelize,
      modelName: "supportMessage",
      tableName: "support_messages",
      indexes: [
        { fields: ["conversationId"] },
        { fields: ["createdAt"] },
      ],
    }
  );
  return SupportMessage;
};
