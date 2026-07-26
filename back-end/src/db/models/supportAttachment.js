"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportAttachment extends Model {
    static associate(models) {}
  }
  SupportAttachment.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      conversationId: { type: DataTypes.INTEGER, allowNull: true },
      ticketId: { type: DataTypes.INTEGER, allowNull: true },
      messageId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      filename: { type: DataTypes.STRING(255), allowNull: false },
      originalName: { type: DataTypes.STRING(255), allowNull: false },
      mimeType: { type: DataTypes.STRING(100), allowNull: true },
      size: { type: DataTypes.INTEGER, allowNull: true },
      url: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      sequelize,
      modelName: "supportAttachment",
      tableName: "support_attachments",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["conversationId"] },
        { fields: ["ticketId"] },
        { fields: ["messageId"] },
      ],
    }
  );
  return SupportAttachment;
};
