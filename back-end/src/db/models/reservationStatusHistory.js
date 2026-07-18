"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReservationStatusHistory extends Model {
    static associate(models) {}
  }

  ReservationStatusHistory.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reservationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fromStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      toStatus: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      actorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actorType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "reservationStatusHistory",
      tableName: "reservation_status_history",
    }
  );

  return ReservationStatusHistory;
};
