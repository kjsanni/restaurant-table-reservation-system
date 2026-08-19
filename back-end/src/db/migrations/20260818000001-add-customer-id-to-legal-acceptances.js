"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("legal_acceptances", "customerId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex("legal_acceptances", ["customerId"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("legal_acceptances", ["customerId"]);
    await queryInterface.removeColumn("legal_acceptances", "customerId");
  },
};
