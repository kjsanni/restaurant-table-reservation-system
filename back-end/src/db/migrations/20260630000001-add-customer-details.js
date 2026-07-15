"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Customers", "address", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("Customers", "city", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("Customers", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Customers", "notes");
    await queryInterface.removeColumn("Customers", "city");
    await queryInterface.removeColumn("Customers", "address");
  },
};
