"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MenuCategory extends Model {
    static associate(models) {
      MenuCategory.hasMany(models.menuItem, {
        foreignKey: "categoryId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
    }
  }
  MenuCategory.init(
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
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "menuCategory",
      tableName: "MenuCategories",
    }
  );
  return MenuCategory;
};
