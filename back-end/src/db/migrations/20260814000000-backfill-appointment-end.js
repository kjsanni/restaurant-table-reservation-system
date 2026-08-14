"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET end = DATE_ADD(start, INTERVAL (durationMinutes + bufferMinutes) MINUTE)
      WHERE end IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET end = NULL
      WHERE end = DATE_ADD(start, INTERVAL (durationMinutes + bufferMinutes) MINUTE)
    `);
  },
};
