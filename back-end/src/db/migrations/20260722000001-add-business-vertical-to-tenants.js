"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("tenants");

    if (!columns.businessVertical) {
      await queryInterface.addColumn("tenants", "businessVertical", {
        type: Sequelize.ENUM("restaurant", "salon"),
        allowNull: false,
        defaultValue: "restaurant",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "businessVertical");
  },
};
