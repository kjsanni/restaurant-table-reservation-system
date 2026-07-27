"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("marketing_campaigns", "recipients", {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("marketing_campaigns", "recipients");
  },
};
