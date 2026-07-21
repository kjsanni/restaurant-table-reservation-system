"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("Customers");
    if (!tableInfo.address) {
      await queryInterface.addColumn("Customers", "address", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!tableInfo.city) {
      await queryInterface.addColumn("Customers", "city", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
    if (!tableInfo.latitude) {
      await queryInterface.addColumn("Customers", "latitude", {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    }
    if (!tableInfo.longitude) {
      await queryInterface.addColumn("Customers", "longitude", {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    }
  },
  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable("Customers");
    if (tableInfo.longitude) await queryInterface.removeColumn("Customers", "longitude");
    if (tableInfo.latitude) await queryInterface.removeColumn("Customers", "latitude");
    if (tableInfo.city) await queryInterface.removeColumn("Customers", "city");
    if (tableInfo.address) await queryInterface.removeColumn("Customers", "address");
  },
};
