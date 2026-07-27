"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PlatformReport extends Model {
    static associate(models) {}
  }
  PlatformReport.init(
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      reportType: {
        type: DataTypes.ENUM("tenants", "revenue", "reservations", "orders", "payments", "support", "usage"),
        allowNull: false,
      },
      format: {
        type: DataTypes.ENUM("csv", "pdf"),
        allowNull: false,
      },
      filters: { type: DataTypes.JSON, allowNull: true },
      schedule: { type: DataTypes.JSON, allowNull: true },
      status: {
        type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      fileUrl: { type: DataTypes.STRING(500), allowNull: true },
      error: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "platformReport",
      tableName: "platform_reports",
      indexes: [
        { fields: ["reportType"] },
        { fields: ["status"] },
        { fields: ["createdBy"] },
      ],
    }
  );
  return PlatformReport;
};
