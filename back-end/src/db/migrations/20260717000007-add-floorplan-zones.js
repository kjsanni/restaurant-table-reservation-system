"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("FloorPlans");
    if (!table.zones) {
      await queryInterface.addColumn("FloorPlans", "zones", {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("FloorPlans", "zones");
  },
};
