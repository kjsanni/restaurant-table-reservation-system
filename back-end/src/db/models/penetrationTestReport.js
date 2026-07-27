"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PenetrationTestReport extends Model {
    static associate(models) {}
  }
  PenetrationTestReport.init(
    {
      title: { type: DataTypes.STRING(255), allowNull: false },
      tester: { type: DataTypes.STRING(255), allowNull: true },
      reportDate: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("draft", "submitted", "reviewed", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      findings: { type: DataTypes.TEXT, allowNull: true },
      remediation: { type: DataTypes.TEXT, allowNull: true },
      filePath: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      sequelize,
      modelName: "penetrationTestReport",
      tableName: "penetration_test_reports",
      indexes: [{ fields: ["status"] }, { fields: ["reportDate"] }],
    }
  );
  return PenetrationTestReport;
};
