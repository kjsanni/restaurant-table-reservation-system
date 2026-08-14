"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PassSigningRequest extends Model {
    static associate(models) {
      if (models.tenant) {
        PassSigningRequest.belongsTo(models.tenant, {
          foreignKey: "tenantId",
          onDelete: "CASCADE",
        });
      }
      if (models.event) {
        PassSigningRequest.belongsTo(models.event, {
          foreignKey: "eventId",
          onDelete: "SET NULL",
        });
      }
      if (models.user) {
        PassSigningRequest.belongsTo(models.user, {
          foreignKey: "requesterId",
          as: "requester",
          onDelete: "CASCADE",
        });
        PassSigningRequest.belongsTo(models.user, {
          foreignKey: "reviewerId",
          as: "reviewer",
          onDelete: "SET NULL",
        });
      }
      if (models.signedPassArtifact) {
        PassSigningRequest.hasMany(models.signedPassArtifact, {
          foreignKey: "requestId",
          as: "artifacts",
        });
      }
    }
  }

  PassSigningRequest.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      eventId: { type: DataTypes.INTEGER, allowNull: true },
      requesterId: { type: DataTypes.INTEGER, allowNull: false },
      reviewerId: { type: DataTypes.INTEGER, allowNull: true },
      designSnapshot: { type: DataTypes.JSON, allowNull: false },
      status: {
        type: DataTypes.ENUM("pending_payment", "pending", "approved", "rejected", "signing", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending_payment",
      },
      paymentReference: { type: DataTypes.STRING(100), allowNull: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: true, defaultValue: "GHS" },
      platformStatuses: { type: DataTypes.JSON, allowNull: true },
      reviewNotes: { type: DataTypes.TEXT, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "passSigningRequest",
      tableName: "pass_signing_requests",
      indexes: [{ fields: ["tenantId"] }],
    }
  );
  return PassSigningRequest;
};
