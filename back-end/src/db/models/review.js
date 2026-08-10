"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.reservation, {
        foreignKey: "reservationId",
        onDelete: "cascade",
        onUpdate: "cascade",
      });
      Review.belongsTo(models.customer, {
        foreignKey: "customerId",
        onDelete: "cascade",
        onUpdate: "cascade",
      });
      Review.belongsTo(models.tenant, {
        foreignKey: "tenantId",
        onDelete: "SET NULL",
      });
    }
  }

  Review.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reservationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      channel: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      flagged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      flagReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "review",
      tableName: "Reviews",
      indexes: [
        {
          fields: ["tenantId", "reservationId"],
        },
        {
          fields: ["tenantId", "customerId"],
        },
      ],
    }
  );

  return Review;
};
