"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Tables");
    if (!table.shape) {
      await queryInterface.addColumn("Tables", "shape", {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "round",
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Tables");
    if (table.shape) {
      await queryInterface.removeColumn("Tables", "shape");
    }
  },
};
