"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("payments", "orderId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Orders", key: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("payments", ["orderId"], {
      name: "payments_order_id",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("payments", "payments_order_id");
    await queryInterface.removeColumn("payments", "orderId");
  },
};
