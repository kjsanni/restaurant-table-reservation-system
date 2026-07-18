"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.user, {
        through: "user_groups",
        foreignKey: "groupId",
        otherKey: "userId",
      });
    }
  }

  Group.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "group",
      indexes: [
        {
          unique: true,
          fields: ["tenantId", "name"],
        },
      ],
    }
  );

  return Group;
};
