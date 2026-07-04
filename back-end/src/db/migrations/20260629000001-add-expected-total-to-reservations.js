"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Reservations", "expectedTotal", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(
      `UPDATE Reservations SET expectedTotal = GREATEST(people * 50, 0) WHERE expectedTotal = 0`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Reservations", "expectedTotal");
  },
};
