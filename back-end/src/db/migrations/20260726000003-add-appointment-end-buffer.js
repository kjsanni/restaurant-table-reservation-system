"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("appointments", "end", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("appointments", "bufferMinutes", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addIndex("appointments", ["end"]);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("appointments", ["end"]);
    await queryInterface.removeColumn("appointments", "bufferMinutes");
    await queryInterface.removeColumn("appointments", "end");
  },
};
