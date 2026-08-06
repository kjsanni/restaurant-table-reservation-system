"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("invoices", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("invoices", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("invoices", ["locationId"]);
    await queryInterface.removeColumn("invoices", "locationId");
  },
};
