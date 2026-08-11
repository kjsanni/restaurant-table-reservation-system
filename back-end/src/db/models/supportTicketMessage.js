"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportTicketMessage extends Model {
    static associate(models) {}
  }
  SupportTicketMessage.init(
    {
      ticketId: { type: DataTypes.INTEGER, allowNull: false },
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
      modelName: "supportTicketMessage",
      tableName: "support_ticket_messages",
      timestamps: false,
      indexes: [
        { fields: ["ticketId"] },
        { fields: ["createdAt"] },
      ],
    }
  );
  return SupportTicketMessage;
};
