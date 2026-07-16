"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tables", "posX", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("Tables", "posY", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("Tables", "shape", {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: "round",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Tables", "posX");
    await queryInterface.removeColumn("Tables", "posY");
    await queryInterface.removeColumn("Tables", "shape");
  },
};
