"use strict";

const { Model } = require("sequelize");

const getRecurringAppointmentAttributes = (DataTypes) => ({
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
      stylistId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      stationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      frequency: {
        type: DataTypes.ENUM("daily", "weekly", "biweekly", "monthly"),
        allowNull: false,
      },
      interval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      timeOfDay: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastGeneratedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
});

module.exports = (sequelize, DataTypes) => {
  class RecurringAppointment extends Model {
    static associate(_unused) {}
  }
  RecurringAppointment.init(getRecurringAppointmentAttributes(DataTypes), {
    sequelize,
    modelName: "recurring_appointment",
    tableName: "recurring_appointments",
  });
  return RecurringAppointment;
};
