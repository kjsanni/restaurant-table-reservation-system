"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ComplianceEvidence extends Model {
    static associate(models) {}
  }
  ComplianceEvidence.init(
    {
      framework: {
        type: DataTypes.ENUM("SOC2", "ISO27001", "GDPR", "DPA2012"),
        allowNull: false,
      },
      controlId: { type: DataTypes.STRING(100), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("not_started", "in_progress", "completed", "failed"),
        allowNull: false,
        defaultValue: "not_started",
      },
      owner: { type: DataTypes.STRING(255), allowNull: true },
      dueDate: { type: DataTypes.DATE, allowNull: true },
      evidenceUrl: { type: DataTypes.STRING(500), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "complianceEvidence",
      tableName: "compliance_evidence",
      indexes: [{ fields: ["framework", "status"] }, { fields: ["controlId"] }],
    }
  );
  return ComplianceEvidence;
};
