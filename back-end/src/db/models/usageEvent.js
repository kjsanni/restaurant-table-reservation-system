"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UsageEvent extends Model {
    static associate(models) {
      UsageEvent.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  UsageEvent.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      resource: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "usageEvent",
      tableName: "UsageEvents",
    }
  );

  return UsageEvent;
};
