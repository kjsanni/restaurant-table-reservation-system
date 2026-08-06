"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EmailVerification extends Model {
    static associate(models) {
      EmailVerification.belongsTo(models.user, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }
  EmailVerification.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false },
      token: { type: DataTypes.STRING(255), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      usedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "emailVerification",
      tableName: "email_verifications",
      indexes: [
        { fields: ["token"], unique: true },
        { fields: ["userId"] },
        { fields: ["email"] },
      ],
    }
  );
  return EmailVerification;
};
