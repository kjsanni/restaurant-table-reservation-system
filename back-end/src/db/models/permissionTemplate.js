"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PermissionTemplate extends Model {
    static associate(models) {}
  }

  PermissionTemplate.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "permissionTemplate",
      tableName: "permission_templates",
    }
  );

  return PermissionTemplate;
};
