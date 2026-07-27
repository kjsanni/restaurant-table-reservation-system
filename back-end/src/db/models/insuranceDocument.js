"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InsuranceDocument extends Model {
    static associate(models) {}
  }
  InsuranceDocument.init(
    {
      title: { type: DataTypes.STRING(255), allowNull: false },
      insurer: { type: DataTypes.STRING(255), allowNull: true },
      policyNumber: { type: DataTypes.STRING(100), allowNull: true },
      coverageType: { type: DataTypes.STRING(100), allowNull: true },
      startDate: { type: DataTypes.DATE, allowNull: true },
      expiryDate: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "expired", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
      filePath: { type: DataTypes.STRING(500), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "insuranceDocument",
      tableName: "insurance_documents",
      indexes: [{ fields: ["status"] }, { fields: ["expiryDate"] }],
    }
  );
  return InsuranceDocument;
};
