"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FloorPlan extends Model {
    static associate(models) {
      FloorPlan.hasMany(models.table, { foreignKey: "floorPlanId" });
    }
  }
  FloorPlan.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      zones: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "floorPlan",
      tableName: "FloorPlans",
    }
  );
  return FloorPlan;
};
