"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const DsarRequest = sequelize.define(
    "dsarRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      requestType: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      requestData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      staffNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fulfilledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
    },
    {
      tableName: "dsar_requests",
      timestamps: true,
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["status"] },
        { fields: ["requestType"] },
        { fields: ["createdAt"] },
        { fields: ["tenantId", "status"] },
      ],
    }
  );

  return DsarRequest;
};
