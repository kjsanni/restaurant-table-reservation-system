"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("appointments", "paymentReference", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("appointments", "refundedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("appointments", "paymentReference");
    await queryInterface.removeColumn("appointments", "refundedAt");
  },
};
