"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OrderItems", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Orders", key: "id" },
        onDelete: "CASCADE",
      },
      menuItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "MenuItems", key: "id" },
        onDelete: "RESTRICT",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      selectedOptions: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      itemNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lineTotal: {
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

    await queryInterface.addIndex("OrderItems", ["orderId"], {
      name: "order_items_order_id",
    });
    await queryInterface.addIndex("OrderItems", ["menuItemId"], {
      name: "order_items_menu_item_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("OrderItems");
  },
};
