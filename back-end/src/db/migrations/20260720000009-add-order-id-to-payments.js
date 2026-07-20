"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Payments", "orderId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Orders", key: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("Payments", ["orderId"], {
      name: "payments_order_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("Payments", "payments_order_id");
    await queryInterface.removeColumn("Payments", "orderId");
  },
};
