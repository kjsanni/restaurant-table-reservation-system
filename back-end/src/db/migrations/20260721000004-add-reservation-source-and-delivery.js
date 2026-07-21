"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("Reservations");
    if (!tableInfo.source) {
      await queryInterface.addColumn("Reservations", "source", {
        type: Sequelize.ENUM("web", "whatsapp", "phone", "walkin"),
        allowNull: true,
        defaultValue: "web",
      });
      await queryInterface.sequelize.query(
        "UPDATE `Reservations` SET `source` = 'web' WHERE `source` IS NULL"
      );
      await queryInterface.changeColumn("Reservations", "source", {
        type: Sequelize.ENUM("web", "whatsapp", "phone", "walkin"),
        allowNull: false,
        defaultValue: "web",
      });
    }
    if (!tableInfo.deliveryAddress) {
      await queryInterface.addColumn("Reservations", "deliveryAddress", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!tableInfo.deliveryLat) {
      await queryInterface.addColumn("Reservations", "deliveryLat", {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    }
    if (!tableInfo.deliveryLng) {
      await queryInterface.addColumn("Reservations", "deliveryLng", {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    }
  },
  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable("Reservations");
    if (tableInfo.deliveryLng) await queryInterface.removeColumn("Reservations", "deliveryLng");
    if (tableInfo.deliveryLat) await queryInterface.removeColumn("Reservations", "deliveryLat");
    if (tableInfo.deliveryAddress) await queryInterface.removeColumn("Reservations", "deliveryAddress");
    if (tableInfo.source) await queryInterface.removeColumn("Reservations", "source");
  },
};
