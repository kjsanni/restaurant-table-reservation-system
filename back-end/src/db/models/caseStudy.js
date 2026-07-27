"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CaseStudy extends Model {
    static associate(models) {
      CaseStudy.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        onDelete: "SET NULL",
      });
    }
  }

  CaseStudy.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: true },
      imageUrl: { type: DataTypes.STRING(255), allowNull: true },
      isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: "caseStudy",
      tableName: "case_studies",
    }
  );

  return CaseStudy;
};
