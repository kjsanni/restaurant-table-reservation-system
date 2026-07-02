"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Customers", "phone", {
      type: Sequelize.STRING(15),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Customers", "phone", {
      type: Sequelize.STRING(10),
      allowNull: false,
    });
  },
};
