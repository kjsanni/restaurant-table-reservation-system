"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MenuItems", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onDelete: "SET NULL",
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "MenuCategories", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      imageUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex("MenuItems", ["tenantId", "name"], {
      unique: true,
      name: "unique_tenant_menu_item_name",
    });
    await queryInterface.addIndex("MenuItems", ["tenantId", "categoryId"], {
      name: "menu_items_tenant_category",
    });
    await queryInterface.addIndex("MenuItems", ["tenantId"], {
      name: "menu_items_tenant_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("MenuItems");
  },
};
