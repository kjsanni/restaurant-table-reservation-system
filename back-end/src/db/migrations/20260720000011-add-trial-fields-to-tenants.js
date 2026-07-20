"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("tenants", "trialExtendsTo", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("tenants", "convertedFromTrialAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "convertedFromTrialAt");
    await queryInterface.removeColumn("tenants", "trialExtendsTo");
  },
};
