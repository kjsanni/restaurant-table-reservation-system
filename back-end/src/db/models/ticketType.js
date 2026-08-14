"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TicketType extends Model {
    static associate(models) {
      if (models.tenant) {
        TicketType.belongsTo(models.tenant, {
          foreignKey: "tenantId",
          onDelete: "SET NULL",
        });
      }
      if (models.event) {
        TicketType.belongsTo(models.event, {
          foreignKey: "eventId",
          onDelete: "CASCADE",
        });
      }
      if (models.guestList) {
        TicketType.hasMany(models.guestList, {
          foreignKey: "ticketTypeId",
          onDelete: "SET NULL",
        });
      }
    }
  }

  TicketType.init(
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Ticket type name is required",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: {
            args: [0],
            msg: "Price cannot be negative",
          },
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: "GHS",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: [1],
            msg: "Quantity must be at least 1",
          },
        },
      },
      soldCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "TicketTypes",
      timestamps: true,
    }
  );

  return TicketType;
};
