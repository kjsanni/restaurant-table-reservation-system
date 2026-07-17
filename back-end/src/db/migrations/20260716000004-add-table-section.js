"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tables", "section", {
      type: Sequelize.STRING(40),
      allowNull: true,
      defaultValue: "main",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Tables", "section");
  },
};
