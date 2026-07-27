"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("recurring_appointments");
    if (!table.lastGeneratedAt) {
      await queryInterface.addColumn("recurring_appointments", "lastGeneratedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("recurring_appointments", "lastGeneratedAt");
  },
};
