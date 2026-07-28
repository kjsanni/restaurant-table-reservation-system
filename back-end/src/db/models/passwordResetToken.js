"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      PasswordResetToken.belongsTo(models.user, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }
  PasswordResetToken.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.STRING(255), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
      ipAddress: { type: DataTypes.STRING(45), allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      modelName: "passwordResetToken",
      tableName: "password_reset_tokens",
      indexes: [
        { fields: ["token"], unique: true },
        { fields: ["userId"] },
        { fields: ["expiresAt"] },
      ],
    }
  );
  return PasswordResetToken;
};
