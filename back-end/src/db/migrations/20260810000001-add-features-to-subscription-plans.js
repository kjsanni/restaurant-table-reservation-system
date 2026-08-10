"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("subscription_plans");
    if (!columns.features) {
      await queryInterface.addColumn("subscription_plans", "features", {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("subscription_plans", "features");
  },
};
