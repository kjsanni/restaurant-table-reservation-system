"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("customers", "address", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("customers", "city", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("customers", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("customers", "notes");
    await queryInterface.removeColumn("customers", "city");
    await queryInterface.removeColumn("customers", "address");
  },
};
