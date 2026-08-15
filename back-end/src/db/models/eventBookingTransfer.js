"use strict";
const { Model } = require("sequelize");

const getEventBookingTransferAttributes = (DataTypes) => ({
  tenantId: { type: DataTypes.INTEGER, allowNull: true },
  eventBookingId: { type: DataTypes.INTEGER, allowNull: false },
  fromEmail: { type: DataTypes.STRING(255), allowNull: true },
  fromName: { type: DataTypes.STRING(255), allowNull: true },
  toEmail: { type: DataTypes.STRING(255), allowNull: true },
  toName: { type: DataTypes.STRING(255), allowNull: true },
  transferredAt: { allowNull: false, type: DataTypes.DATE },
  transferredBy: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
});

module.exports = (sequelize, DataTypes) => {
  class EventBookingTransfer extends Model {
    static associate(models) {
      if (models.eventBooking) {
        EventBookingTransfer.belongsTo(models.eventBooking, {
          foreignKey: "eventBookingId",
          onDelete: "CASCADE",
        });
      }
      if (models.user) {
        EventBookingTransfer.belongsTo(models.user, {
          foreignKey: "transferredBy",
          onDelete: "SET NULL",
        });
      }
    }
  }

  EventBookingTransfer.init(getEventBookingTransferAttributes(DataTypes), {
    sequelize,
    modelName: "eventBookingTransfer",
    tableName: "event_booking_transfers",
    timestamps: true,
    underscored: true,
  });

  return EventBookingTransfer;
};
