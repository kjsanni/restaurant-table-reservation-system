"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const LegalAcceptance = sequelize.define(
    "legalAcceptance",
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
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING(30),
        allowNull: false,
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
      tableName: "legal_acceptances",
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["slug"] },
        { fields: ["tenantId", "slug"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return LegalAcceptance;
};
