"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "locale", {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: "en",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "locale");
  },
};
