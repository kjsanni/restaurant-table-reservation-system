"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class LoginAttempt extends Model {
    static associate(models) {
      // No associations needed for login attempts
    }
  }
  LoginAttempt.init(
    {
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      attemptedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "loginAttempt",
      tableName: "login_attempts",
      timestamps: true,
    }
  );
  return LoginAttempt;
};
