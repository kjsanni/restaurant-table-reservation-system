"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("expenses", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("expenses", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("expenses", ["locationId"]);
    await queryInterface.removeColumn("expenses", "locationId");
  },
};
