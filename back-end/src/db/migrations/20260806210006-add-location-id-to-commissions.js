"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("commissions", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("commissions", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("commissions", ["locationId"]);
    await queryInterface.removeColumn("commissions", "locationId");
  },
};
