"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("Deliveries");
    if (!tableInfo.whatsappSessionId) {
      await queryInterface.addColumn("Deliveries", "whatsappSessionId", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },
  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable("Deliveries");
    if (tableInfo.whatsappSessionId) {
      await queryInterface.removeColumn("Deliveries", "whatsappSessionId");
    }
  },
};
