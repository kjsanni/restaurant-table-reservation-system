"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate("subscription_plans", { erpnextModules: [] }, { slug: "starter" });
    await queryInterface.bulkUpdate("subscription_plans", { erpnextModules: ["erpnext_accounting", "erpnext_crm"] }, { slug: "growth" });
    await queryInterface.bulkUpdate("subscription_plans", { erpnextModules: [] }, { slug: "scale" });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate("subscription_plans", { erpnextModules: null }, { slug: ["starter", "growth", "scale"] });
  },
};
