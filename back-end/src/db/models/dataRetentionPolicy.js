"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DataRetentionPolicy extends Model {
    static associate(models) {}
  }
  DataRetentionPolicy.init(
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      tableName: { type: DataTypes.STRING(255), allowNull: false },
      retentionDays: { type: DataTypes.INTEGER, allowNull: false },
      action: {
        type: DataTypes.ENUM("delete", "archive", "anonymize"),
        allowNull: false,
        defaultValue: "delete",
      },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastRunAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "dataRetentionPolicy",
      tableName: "data_retention_policies",
      indexes: [
        { fields: ["tableName"] },
        { fields: ["isActive"] },
      ],
    }
  );
  return DataRetentionPolicy;
};
