"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stations", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("stations", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("stations", ["locationId"]);
    await queryInterface.removeColumn("stations", "locationId");
  },
};
