"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class StaffShift extends Model {
    static associate(models) {
      StaffShift.belongsTo(models.user, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }
  StaffShift.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
      },
      dayOfWeek: {
        type: DataTypes.ENUM(
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday"
        ),
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "staffShift",
      tableName: "StaffShifts",
    }
  );
  return StaffShift;
};
