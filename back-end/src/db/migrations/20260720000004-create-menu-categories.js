"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MenuCategories", {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex("MenuCategories", ["tenantId", "name"], {
      unique: true,
      name: "unique_tenant_category_name",
    });
    await queryInterface.addIndex("MenuCategories", ["tenantId"], {
      name: "menu_categories_tenant_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("MenuCategories");
  },
};
