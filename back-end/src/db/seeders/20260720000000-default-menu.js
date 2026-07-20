"use strict";

const db = require("../../db/models");

module.exports = {
  up: async (queryInterface) => {
    const [tenant] = await queryInterface.sequelize.query(
      `SELECT id FROM tenants WHERE id = 1 LIMIT 1`
    );

    if (!tenant || tenant.length === 0) {
      return;
    }

    const categories = [
      { tenantId: 1, name: "Starters", description: "Light bites and appetizers", sortOrder: 0 },
      { tenantId: 1, name: "Mains", description: "Main courses", sortOrder: 1 },
      { tenantId: 1, name: "Drinks", description: "Hot and cold beverages", sortOrder: 2 },
    ];

    await queryInterface.bulkInsert("MenuCategories", categories, {});

    const [cats] = await queryInterface.sequelize.query(
      `SELECT id, name FROM MenuCategories WHERE tenantId = 1`
    );
    const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));

    const items = [
      { tenantId: 1, categoryId: catMap["Starters"], name: "Grilled Prawns", description: "Served with garlic aioli", price: 45.0, isAvailable: true, sortOrder: 0 },
      { tenantId: 1, categoryId: catMap["Starters"], name: "Caesar Salad", description: "Romaine, parmesan, croutons", price: 32.0, isAvailable: true, sortOrder: 1 },
      { tenantId: 1, categoryId: catMap["Mains"], name: "Grilled Tilapia", description: "With jollof and vegetables", price: 85.0, isAvailable: true, sortOrder: 0 },
      { tenantId: 1, categoryId: catMap["Mains"], name: "Jollof Rice & Chicken", description: "Classic Ghanaian jollof with quarter chicken", price: 65.0, isAvailable: true, sortOrder: 1 },
      { tenantId: 1, categoryId: catMap["Drinks"], name: "Fresh Orange Juice", description: "Freshly squeezed", price: 18.0, isAvailable: true, sortOrder: 0 },
      { tenantId: 1, categoryId: catMap["Drinks"], name: "Bottled Water", description: "500ml", price: 8.0, isAvailable: true, sortOrder: 1 },
    ];

    await queryInterface.bulkInsert("MenuItems", items, {});

    const [menuItems] = await queryInterface.sequelize.query(
      `SELECT id, name FROM MenuItems WHERE tenantId = 1`
    );
    const itemMap = Object.fromEntries(menuItems.map((i) => [i.name, i.id]));

    const options = [
      { menuItemId: itemMap["Grilled Prawns"], name: "Extra Spicy", priceAdjustment: 5.0 },
      { menuItemId: itemMap["Grilled Prawns"], name: "Extra Sauce", priceAdjustment: 3.0 },
      { menuItemId: itemMap["Grilled Tilapia"], name: "Extra Pepper", priceAdjustment: 2.0 },
      { menuItemId: itemMap["Jollof Rice & Chicken"], name: "Extra Chicken", priceAdjustment: 25.0 },
      { menuItemId: itemMap["Jollof Rice & Chicken"], name: "No Onions", priceAdjustment: 0 },
      { menuItemId: itemMap["Fresh Orange Juice"], name: "Extra Ice", priceAdjustment: 0 },
    ];

    await queryInterface.bulkInsert("MenuItemOptions", options, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("MenuItemOptions", {});
    await queryInterface.bulkDelete("MenuItems", {});
    await queryInterface.bulkDelete("MenuCategories", {});
  },
};
