"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FeatureFlagPreset extends Model {
    static associate(models) {
    }
  }

  FeatureFlagPreset.init(
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      featureFlags: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "featureFlagPreset",
      tableName: "feature_flag_presets",
    }
  );

  return FeatureFlagPreset;
};
