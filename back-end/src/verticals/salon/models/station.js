"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Station extends Model {
  static associate(models) {
    Station.belongsTo(models.user, {
      foreignKey: "defaultStylistId",
      as: "defaultStylist",
    });
    Station.belongsTo(models.floorPlan, {
      foreignKey: "floorPlanId",
      as: "floorPlan",
    });
    Station.hasMany(models.appointment, {
      foreignKey: "stationId",
      as: "appointments",
    });
  }
  }
  Station.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("chair", "wash", "color", "nail", "therapy"),
        allowNull: false,
        defaultValue: "chair",
      },
      zone: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1, max: 1 },
      },
      isOccupied: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      floorPlanId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      maintenanceNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "station",
      tableName: "stations",
    }
  );
  return Station;
};
