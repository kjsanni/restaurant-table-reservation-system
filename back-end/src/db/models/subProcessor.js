"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SubProcessor extends Model {
    static associate(models) {}
  }
  SubProcessor.init(
    {
      name: { type: DataTypes.STRING(255), allowNull: false },
      purpose: { type: DataTypes.TEXT, allowNull: false },
      dataTypes: { type: DataTypes.JSON, allowNull: true },
      location: { type: DataTypes.STRING(255), allowNull: true },
      status: {
        type: DataTypes.ENUM("active", "inactive", "under_review"),
        allowNull: false,
        defaultValue: "active",
      },
      dpaUrl: { type: DataTypes.STRING(500), allowNull: true },
      privacyPolicyUrl: { type: DataTypes.STRING(500), allowNull: true },
    },
    {
      sequelize,
      modelName: "subProcessor",
      tableName: "sub_processors",
      indexes: [{ fields: ["status"] }],
    }
  );
  return SubProcessor;
};
