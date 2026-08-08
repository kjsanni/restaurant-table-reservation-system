"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payments", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("payments", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("payments", ["locationId"]);
    await queryInterface.removeColumn("payments", "locationId");
  },
};
