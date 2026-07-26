"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ImpersonationSession extends Model {
    static associate(models) {}
  }
  ImpersonationSession.init(
    {
      superAdminId: { type: DataTypes.INTEGER, allowNull: false },
      tenantUserId: { type: DataTypes.INTEGER, allowNull: false },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
      ipAddress: { type: DataTypes.STRING(45), allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      endedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "impersonationSession",
      tableName: "impersonation_sessions",
      indexes: [
        { fields: ["superAdminId"] },
        { fields: ["tenantUserId"] },
        { fields: ["token"] },
      ],
    }
  );
  return ImpersonationSession;
};
