"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const appointmentCols = await queryInterface.describeTable("appointments");
    if (!appointmentCols.locationId) {
      await queryInterface.addColumn("appointments", "locationId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    const serviceCols = await queryInterface.describeTable("services");
    if (!serviceCols.locationId) {
      await queryInterface.addColumn("services", "locationId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("appointments", "locationId");
    await queryInterface.removeColumn("services", "locationId");
  },
};
