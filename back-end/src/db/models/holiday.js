"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Holiday extends Model {
    static associate(models) {}
  }
  Holiday.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      openTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      closeTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      overrideType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "holiday",
      indexes: [
        {
          unique: true,
          fields: ["tenantId", "date"],
        },
      ],
    }
  );
  return Holiday;
};