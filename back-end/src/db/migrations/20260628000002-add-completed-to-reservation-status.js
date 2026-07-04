'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Reservations MODIFY resStatus ENUM('pending', 'seated', 'missed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending'`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE Reservations MODIFY resStatus ENUM('pending', 'seated', 'missed', 'cancelled') NOT NULL DEFAULT 'pending'`
    );
  },
};
