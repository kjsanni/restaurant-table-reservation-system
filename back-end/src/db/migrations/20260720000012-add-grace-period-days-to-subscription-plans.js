"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("subscription_plans", "gracePeriodDays", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("subscription_plans", "gracePeriodDays");
  },
};
