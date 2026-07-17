"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("waitlist", "customerId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex("waitlist", ["customerId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("waitlist", "customerId");
  },
};
