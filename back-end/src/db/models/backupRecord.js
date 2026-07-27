"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BackupRecord extends Model {
    static associate(models) {}
  }
  BackupRecord.init(
    {
      type: {
        type: DataTypes.ENUM("full", "incremental", "snapshot"),
        allowNull: false,
        defaultValue: "full",
      },
      status: {
        type: DataTypes.ENUM("pending", "running", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      sizeBytes: { type: DataTypes.BIGINT, allowNull: true },
      storagePath: { type: DataTypes.STRING(255), allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      error: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
      frequency: {
        type: DataTypes.ENUM("daily", "weekly", "monthly"),
        allowNull: true,
      },
      nextRunAt: { type: DataTypes.DATE, allowNull: true },
      lastRunAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "backupRecord",
      tableName: "backup_records",
      indexes: [
        { fields: ["status"] },
        { fields: ["createdAt"] },
      ],
    }
  );
  return BackupRecord;
};
