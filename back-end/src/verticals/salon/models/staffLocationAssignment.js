"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StaffLocationAssignment extends Model {
    static associate(models) {
      StaffLocationAssignment.belongsTo(models.user, {
        foreignKey: "userId",
        as: "user",
      });
      StaffLocationAssignment.belongsTo(models.location, {
        foreignKey: "locationId",
        as: "location",
      });
    }
  }
  StaffLocationAssignment.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "staffLocationAssignment",
      tableName: "staff_location_assignments",
    }
  );
  return StaffLocationAssignment;
};
