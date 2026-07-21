"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("MenuItems", "isVegetarian", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("MenuItems", "isVegan", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("MenuItems", "isGlutenFree", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("MenuItems", "isSpicy", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("MenuItems", "isNutFree", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex("MenuItems", ["isVegetarian", "isVegan", "isGlutenFree"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("MenuItems", "isVegetarian");
    await queryInterface.removeColumn("MenuItems", "isVegan");
    await queryInterface.removeColumn("MenuItems", "isGlutenFree");
    await queryInterface.removeColumn("MenuItems", "isSpicy");
    await queryInterface.removeColumn("MenuItems", "isNutFree");
  },
};
