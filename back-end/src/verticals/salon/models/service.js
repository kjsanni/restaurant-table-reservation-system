"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
      Service.belongsTo(models.serviceCategory, {
        foreignKey: "categoryId",
        as: "category",
      });
      Service.belongsTo(models.user, {
        foreignKey: "defaultStylistId",
        as: "defaultStylist",
      });
      Service.hasMany(models.appointment, {
        foreignKey: "serviceId",
        as: "appointments",
      });
      Service.hasMany(models.staffServiceSkill, {
        foreignKey: "serviceId",
        as: "staffServiceSkills",
      });
    }
  }
  Service.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: { min: 5 },
      },
      depositAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      bufferMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      defaultStylistId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      requiresStationType: {
        type: DataTypes.ENUM("chair", "wash", "color", "nail", "therapy"),
        allowNull: true,
      },
      whatsappBookable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "service",
      tableName: "services",
    }
  );
  return Service;
};
