"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.customer, {
        foreignKey: "customerId",
        as: "customer",
      });
      Appointment.belongsTo(models.service, {
        foreignKey: "serviceId",
        as: "service",
      });
      Appointment.belongsTo(models.station, {
        foreignKey: "stationId",
        as: "station",
      });
      Appointment.belongsTo(models.user, {
        foreignKey: "stylistId",
        as: "stylist",
      });
    }
  }
  Appointment.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stylistId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "in_progress",
          "completed",
          "cancelled",
          "no_show"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentStatus: {
        type: DataTypes.ENUM("deposit", "partial", "paid", "unpaid"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      depositAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      source: {
        type: DataTypes.ENUM("web", "whatsapp", "phone", "walkin"),
        allowNull: false,
        defaultValue: "web",
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "appointment",
      tableName: "appointments",
    }
  );
  return Appointment;
};
