"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex("Reservations", ["notes"], {
      type: "FULLTEXT",
      name: "notes_fulltext_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("Reservations", "notes_fulltext_idx");
  },
};