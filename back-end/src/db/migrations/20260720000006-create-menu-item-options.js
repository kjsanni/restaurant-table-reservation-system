"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MenuItemOptions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      menuItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "MenuItems", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      priceAdjustment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("MenuItemOptions", ["menuItemId", "name"], {
      unique: true,
      name: "unique_menu_item_option_name",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("MenuItemOptions");
  },
};
