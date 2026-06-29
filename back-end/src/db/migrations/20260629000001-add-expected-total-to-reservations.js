"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("reservations", "expectedTotal", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(
      `UPDATE reservations SET expectedTotal = GREATEST(people * 50, 0) WHERE expectedTotal = 0`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("reservations", "expectedTotal");
  },
};
