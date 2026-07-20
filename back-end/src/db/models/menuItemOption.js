"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MenuItemOption extends Model {
    static associate(models) {
      MenuItemOption.belongsTo(models.menuItem, {
        foreignKey: "menuItemId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        hooks: true,
      });
    }
  }
  MenuItemOption.init(
    {
      menuItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      priceAdjustment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "menuItemOption",
      tableName: "MenuItemOptions",
    }
  );
  return MenuItemOption;
};
