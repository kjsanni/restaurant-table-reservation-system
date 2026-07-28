"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("tenants");

    if (!columns.monthlyRevenue) {
      await queryInterface.addColumn("tenants", "monthlyRevenue", {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "monthlyRevenue");
  },
};
