"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ScheduledReport extends Model {
    static associate(models) {}
  }
  ScheduledReport.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: false },
      reportType: {
        type: DataTypes.ENUM("salon_revenue", "salon_appointments", "salon_stylists", "salon_inventory"),
        allowNull: false,
      },
      format: {
        type: DataTypes.ENUM("csv"),
        allowNull: false,
        defaultValue: "csv",
      },
      filters: { type: DataTypes.JSON, allowNull: true },
      frequency: {
        type: DataTypes.ENUM("daily", "weekly", "monthly"),
        allowNull: false,
      },
      frequencyDay: { type: DataTypes.INTEGER, allowNull: true },
      frequencyTime: { type: DataTypes.STRING(5), allowNull: false, defaultValue: "08:00" },
      recipients: { type: DataTypes.JSON, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastRunAt: { type: DataTypes.DATE, allowNull: true },
      nextRunAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "scheduledReport",
      tableName: "scheduled_reports",
      indexes: [
        { fields: ["tenantId"] },
        { fields: ["nextRunAt"] },
        { fields: ["enabled"] },
      ],
    }
  );
  return ScheduledReport;
};
