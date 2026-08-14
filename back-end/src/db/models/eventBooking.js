"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EventBooking extends Model {
    static associate(models) {
      if (models.tenant) {
        EventBooking.belongsTo(models.tenant, {
          foreignKey: "tenantId",
          onDelete: "SET NULL",
        });
      }
      if (models.event) {
        EventBooking.belongsTo(models.event, {
          foreignKey: "eventId",
          onDelete: "CASCADE",
        });
      }
      if (models.ticketType) {
        EventBooking.belongsTo(models.ticketType, {
          foreignKey: "ticketTypeId",
          onDelete: "SET NULL",
        });
      }
      if (models.customer) {
        EventBooking.belongsTo(models.customer, {
          foreignKey: "customerId",
          onDelete: "SET NULL",
        });
      }
      if (models.user) {
        EventBooking.belongsTo(models.user, {
          foreignKey: "userId",
          onDelete: "SET NULL",
        });
      }
    }
  }

  EventBooking.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Event is required",
          },
        },
      },
      ticketTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: {
            args: [1],
            msg: "Quantity must be at least 1",
          },
        },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: [0],
            msg: "Unit price cannot be negative",
          },
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "cancelled", "refunded"),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentStatus: {
        type: DataTypes.ENUM("unpaid", "paid", "failed", "refunded"),
        allowNull: false,
        defaultValue: "unpaid",
      },
      paymentReference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: "GHS",
      },
      guestName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      guestEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      guestPhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      bookedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "eventBooking",
      tableName: "EventBookings",
      timestamps: true,
    }
  );

  return EventBooking;
};
