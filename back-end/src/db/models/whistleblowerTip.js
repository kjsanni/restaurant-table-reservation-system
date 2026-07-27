"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class WhistleblowerTip extends Model {
    static associate(models) {}
  }
  WhistleblowerTip.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          "theft",
          "fraud",
          "harassment",
          "safety",
          "compliance",
          "other"
        ),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        allowNull: false,
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM("pending", "reviewing", "resolved", "dismissed"),
        allowNull: false,
        defaultValue: "pending",
      },
      contactInfo: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      resolvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolutionNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "whistleblowerTip",
      tableName: "whistleblower_tips",
    }
  );
  return WhistleblowerTip;
};
