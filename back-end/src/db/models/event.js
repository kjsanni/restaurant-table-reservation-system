"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      if (models.tenant) {
        Event.belongsTo(models.tenant, {
          foreignKey: "tenantId",
          onDelete: "SET NULL",
        });
      }
      if (models.user) {
        Event.belongsTo(models.user, {
          as: "createdBy",
          foreignKey: "createdById",
          onDelete: "SET NULL",
        });
      }
      if (models.guestList) {
        Event.hasMany(models.guestList, {
          foreignKey: "eventId",
          onDelete: "CASCADE",
        });
      }
      if (models.ticketType) {
        Event.hasMany(models.ticketType, {
          foreignKey: "eventId",
          onDelete: "CASCADE",
        });
      }
      if (models.qrCode) {
        Event.hasMany(models.qrCode, {
          foreignKey: "eventId",
          onDelete: "CASCADE",
        });
      }
    }
  }

  Event.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Event name is required",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: "Event type must be 50 characters or less",
          },
        },
      },
      venue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: "Event date is required",
          },
        },
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: {
            args: [1],
            msg: "Capacity must be at least 1",
          },
        },
      },
      status: {
        type: DataTypes.ENUM("draft", "published", "cancelled", "completed"),
        allowNull: false,
        defaultValue: "draft",
      },
      isTicketed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      checkinEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      venueLatitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      venueLongitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "Events",
      timestamps: true,
    }
  );

  return Event;
};
