"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("tenants");
    if (!columns.trialExtendsTo) {
      await queryInterface.addColumn("tenants", "trialExtendsTo", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!columns.convertedFromTrialAt) {
      await queryInterface.addColumn("tenants", "convertedFromTrialAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "convertedFromTrialAt");
    await queryInterface.removeColumn("tenants", "trialExtendsTo");
  },
};
