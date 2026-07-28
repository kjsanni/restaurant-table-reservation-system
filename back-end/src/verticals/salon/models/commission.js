"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Commission extends Model {
    static associate(models) {
      Commission.belongsTo(models.user, {
        foreignKey: "userId",
        as: "stylist",
      });
      Commission.belongsTo(models.appointment, {
        foreignKey: "appointmentId",
        as: "appointment",
      });
      Commission.belongsTo(models.service, {
        foreignKey: "serviceId",
        as: "service",
      });
    }
  }
  Commission.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      rateType: {
        type: DataTypes.ENUM("percentage", "fixed"),
        allowNull: false,
        defaultValue: "percentage",
      },
      rateValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "paid", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "commission",
      tableName: "commissions",
    }
  );
  return Commission;
};
