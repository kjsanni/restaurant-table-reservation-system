"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("StaffShifts", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "locations", key: "id" },
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("StaffShifts", ["locationId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("StaffShifts", ["locationId"]);
    await queryInterface.removeColumn("StaffShifts", "locationId");
  },
};
