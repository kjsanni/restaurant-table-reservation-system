"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("tenants");

    if (!columns.restaurantType) {
      await queryInterface.addColumn("tenants", "restaurantType", {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "full_service",
      });
    }

    if (!columns.serviceModes) {
      await queryInterface.addColumn("tenants", "serviceModes", {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: ["dine_in", "takeaway", "delivery"],
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "restaurantType");
    await queryInterface.removeColumn("tenants", "serviceModes");
  },
};
