"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate(models) {}
  }
  Setting.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      key: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      value: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "setting",
      indexes: [
        {
          unique: true,
          fields: ["tenantId", "key"],
        },
      ],
    }
  );
  return Setting;
};