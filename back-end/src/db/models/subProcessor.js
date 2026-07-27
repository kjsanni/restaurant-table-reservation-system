"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SubProcessor extends Model {
    static associate(models) {}
  }
  SubProcessor.init(
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      category: { type: DataTypes.STRING(100), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      dataTypes: { type: DataTypes.JSON, allowNull: true },
      purpose: { type: DataTypes.TEXT, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "subProcessor",
      tableName: "sub_processors",
      indexes: [
        { fields: ["category"] },
        { fields: ["isActive"] },
      ],
    }
  );
  return SubProcessor;
};
