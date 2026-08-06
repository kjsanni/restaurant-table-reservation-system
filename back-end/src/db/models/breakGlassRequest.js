"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const BreakGlassRequest = sequelize.define(
    "breakGlassRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      approverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      justification: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 240,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "denied", "expired", "revoked"),
        allowNull: false,
        defaultValue: "pending",
      },
      elevatedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "break_glass_requests",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: false,
    }
  );

  BreakGlassRequest.associate = (models) => {
    BreakGlassRequest.belongsTo(models.user, {
      foreignKey: "userId",
      as: "requester",
    });
    BreakGlassRequest.belongsTo(models.user, {
      foreignKey: "approverId",
      as: "approver",
    });
  };

  return BreakGlassRequest;
};
