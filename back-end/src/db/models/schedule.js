"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    static associate(models) {}
  }
  Schedule.init(
    {
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
      openTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      closeTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      slotDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        validate: {
          min: 15,
        },
      },
    },
    {
      sequelize,
      modelName: "schedule",
    }
  );
  return Schedule;
};