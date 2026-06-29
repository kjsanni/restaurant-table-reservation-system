"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex("reservations", ["notes"], {
      type: "FULLTEXT",
      name: "notes_fulltext_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("reservations", "notes_fulltext_idx");
  },
};