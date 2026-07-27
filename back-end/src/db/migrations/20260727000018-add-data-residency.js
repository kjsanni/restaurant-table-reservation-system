"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("tenants", "dataRegion", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("tenants", "residencyNotes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "residencyNotes");
    await queryInterface.removeColumn("tenants", "dataRegion");
  },
};
