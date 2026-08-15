"use strict";

module.exports = (sequelize, DataTypes) => {
  const PassSigningRequest = sequelize.define(
    "passSigningRequest",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      eventId: { type: DataTypes.INTEGER, allowNull: true },
      requesterId: { type: DataTypes.INTEGER, allowNull: false },
      reviewerId: { type: DataTypes.INTEGER, allowNull: true },
      designSnapshot: { type: DataTypes.JSON, allowNull: false },
      status: {
        type: DataTypes.ENUM(
          "pending_payment",
          "pending",
          "approved",
          "rejected",
          "signing",
          "completed",
          "failed"
        ),
        allowNull: false,
        defaultValue: "pending_payment",
      },
      paymentReference: { type: DataTypes.STRING(100), allowNull: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      currency: { type: DataTypes.STRING(3), allowNull: true, defaultValue: "GHS" },
      platformStatuses: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      reviewNotes: { type: DataTypes.TEXT, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "pass_signing_requests",
      timestamps: true,
    }
  );

  PassSigningRequest.associate = (models) => {
    if (models.tenant) {
      PassSigningRequest.belongsTo(models.tenant, { foreignKey: "tenantId", as: "tenant" });
    }
    if (models.user) {
      PassSigningRequest.belongsTo(models.user, { foreignKey: "requesterId", as: "requester" });
      PassSigningRequest.belongsTo(models.user, { foreignKey: "reviewerId", as: "reviewer" });
    }
    if (models.Event) {
      PassSigningRequest.belongsTo(models.Event, { foreignKey: "eventId", as: "event" });
    }
    if (models.signedPassArtifact) {
      PassSigningRequest.hasMany(models.signedPassArtifact, { foreignKey: "requestId", as: "artifacts" });
    }
  };

  return PassSigningRequest;
};
