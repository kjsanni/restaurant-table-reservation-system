"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupportNote extends Model {
    static associate(models) {
      SupportNote.belongsTo(models.user, {
        foreignKey: "userId",
        as: "author",
      });
    }
  }
  SupportNote.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      conversationId: { type: DataTypes.INTEGER, allowNull: true },
      ticketId: { type: DataTypes.INTEGER, allowNull: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      mentions: { type: DataTypes.JSON, allowNull: true },
    },
    {
      sequelize,
      modelName: "supportNote",
      tableName: "support_notes",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["conversationId"] },
        { fields: ["ticketId"] },
        { fields: ["userId"] },
      ],
    }
  );
  return SupportNote;
};
