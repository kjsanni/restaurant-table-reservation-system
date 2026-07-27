"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("payments");

    if (!columns.appointmentId) {
      await queryInterface.addColumn("payments", "appointmentId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "appointments", key: "id" },
        onUpdate: "cascade",
        onDelete: "set null",
      });
    }

    if (!columns.appointmentId) {
      await queryInterface.addIndex("payments", ["appointmentId"]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("payments", "appointmentId");
  },
};
