"use strict";
const { Model } = require("sequelize");
const dateTimeValidator = require("../../utils/dateAndTimeValidator");
module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      Reservation.belongsTo(models.customer, {
        foreignKey: {
          allowNull: false,
        },
        onDelete: "cascade",
        onUpdate: "cascade",
        hooks: true,
      });
      Reservation.hasMany(models.table, {
        foreignKey: "reservationId",
        onUpdate: "cascade",
        hooks: true,
      });
      Reservation.belongsToMany(models.user, {
        through: "reservation_staff",
        foreignKey: "reservationId",
        otherKey: "userId",
      });
    }
  }
  Reservation.init(
    {
      resDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Please enter reservation date!",
          },
          isDateInThePast(value) {
            if (value < dateTimeValidator.asDateString(new Date())) {
              throw new Error("Reservation date cannot be in the past!");
            }
          },
        },
      },
      resTime: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Please enter reservation time!",
          },
        },
      },
      people: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: {
            arg: true,
            msg: "Should be an integer value!",
          },
          min: {
            args: [1],
            msg: "One person at least!",
          },
        },
      },
      resStatus: {
        type: DataTypes.ENUM("pending", "seated", "missed", "cancelled", "completed"),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentStatus: {
        type: DataTypes.ENUM("deposit", "partial", "paid", "unpaid"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      expectedTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      occasion: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      recurrence: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      mergedFromTableIds: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "reservation",
      tableName: "Reservations",
    }
  );
  return Reservation;
};
