"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.group, {
        through: "user_groups",
        foreignKey: "userId",
        otherKey: "groupId",
      });
      User.belongsToMany(models.reservation, {
        through: "reservation_staff",
        foreignKey: "userId",
        otherKey: "reservationId",
      });
      User.belongsToMany(models.table, {
        through: "table_staff",
        foreignKey: "userId",
        otherKey: "tableId",
      });
    }
  }
  User.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Username shouldn't be blank!",
          },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isEmail: {
            msg: "Invalid email address!",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password shouldn't be blank!",
          },
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "manager", "staff"),
        allowNull: false,
        defaultValue: "staff",
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: false,
          manage_staff: false,
          view_appointments: true,
          edit_appointments: true,
          manage_stations: false,
          manage_services: false,
        },
      },
    },
    {
      sequelize,
      modelName: "user",
      indexes: [
        {
          unique: true,
          fields: ["tenantId", "email"],
        },
        {
          unique: true,
          fields: ["tenantId", "username"],
        },
      ],
    }
  );
  return User;
};