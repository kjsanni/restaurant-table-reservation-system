"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Waitlist extends Model {
    static associate(models) {
      Waitlist.belongsTo(models.customer, {
        foreignKey: "customerId",
        as: "customer",
      });
    }
  }

  Waitlist.init(
    {
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      partySize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      desiredTime: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("waiting", "seated", "expired", "cancelled"),
        allowNull: false,
        defaultValue: "waiting",
      },
      seatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "waitlist",
      tableName: "waitlist",
      indexes: [
        {
          fields: ["status"],
        },
        {
          fields: ["desiredTime"],
        },
      ],
    }
  );

  return Waitlist;
};
