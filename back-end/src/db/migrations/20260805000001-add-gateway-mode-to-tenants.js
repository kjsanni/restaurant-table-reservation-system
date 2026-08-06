"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("tenants");

    if (!columns.paymentGateway) {
      await queryInterface.addColumn("tenants", "paymentGateway", {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "platform",
      });
    }

    if (!columns.deliveryGateway) {
      await queryInterface.addColumn("tenants", "deliveryGateway", {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "platform",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("tenants", "paymentGateway");
    await queryInterface.removeColumn("tenants", "deliveryGateway");
  },
};
