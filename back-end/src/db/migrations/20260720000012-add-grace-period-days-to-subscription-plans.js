"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("subscription_plans");
    if (!columns.gracePeriodDays) {
      await queryInterface.addColumn("subscription_plans", "gracePeriodDays", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("subscription_plans", "gracePeriodDays");
  },
};
