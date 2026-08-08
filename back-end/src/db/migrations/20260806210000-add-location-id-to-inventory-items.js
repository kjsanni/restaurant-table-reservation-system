"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("inventory_items", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("inventory_items", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("inventory_items", ["locationId"]);
    await queryInterface.removeColumn("inventory_items", "locationId");
  },
};
