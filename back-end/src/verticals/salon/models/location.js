"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Location extends Model {
    static associate(models) {
      Location.hasMany(models.user, {
        foreignKey: "locationId",
        as: "users",
      });
      Location.hasMany(models.appointment, {
        foreignKey: "locationId",
        as: "appointments",
      });
    }
  }
  Location.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      region: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "Africa/Accra",
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: "GHS",
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "location",
      tableName: "locations",
    }
  );
  return Location;
};
