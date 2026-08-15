"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("tenants", "templateId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
    } catch (err) {
      if (err.message && err.message.includes("Duplicate column")) {
        return;
      }
      throw err;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn("tenants", "templateId");
    } catch (err) {
      if (err.message && err.message.includes("Column")) {
        return;
      }
      throw err;
    }
  },
};
