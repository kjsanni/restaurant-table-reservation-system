"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MenuItem extends Model {
    static associate(models) {
      MenuItem.belongsTo(models.menuCategory, {
        foreignKey: "categoryId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
      MenuItem.hasMany(models.menuItemOption, {
        foreignKey: "menuItemId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
    }
  }
  MenuItem.init(
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "menuItem",
      tableName: "MenuItems",
    }
  );
  return MenuItem;
};
