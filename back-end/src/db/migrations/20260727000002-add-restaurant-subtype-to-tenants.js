"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("tenants");
    if (!tableInfo.restaurantSubtype) {
      await queryInterface.addColumn("tenants", "restaurantSubtype", {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: "restaurantType",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "restaurantSubtype");
  },
};
