"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VerticalConfiguration extends Model {
    static associate(models) {
    }
  }

  VerticalConfiguration.init(
    {
      vertical: {
        type: DataTypes.ENUM("restaurant", "salon", "event"),
        allowNull: false,
      },
      useCaseType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      featureFlags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      serviceModes: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      allowedIntegrations: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      uiComponents: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      breakglassRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "verticalConfiguration",
      tableName: "vertical_configurations",
      indexes: [
        {
          unique: true,
          fields: ["vertical", "useCaseType"],
        },
        {
          fields: ["vertical"],
        },
        {
          fields: ["isActive"],
        },
      ],
    }
  );

  return VerticalConfiguration;
};
