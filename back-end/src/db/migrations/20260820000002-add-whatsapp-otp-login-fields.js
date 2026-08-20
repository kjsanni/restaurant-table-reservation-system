"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("users");
    const added = [];

    if (!columns.phone) {
      await queryInterface.addColumn("users", "phone", {
        type: Sequelize.STRING(20),
        allowNull: true,
      });
      added.push("phone");
    }

    if (!columns.firstLoginCompleted) {
      await queryInterface.addColumn("users", "firstLoginCompleted", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
      added.push("firstLoginCompleted");
    }

    if (added.length > 0) {
      // eslint-disable-next-line no-console
      console.info(`[migration] Added user login OTP columns: ${added.join(", ")}`);
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable("users");

    if (columns.firstLoginCompleted) {
      await queryInterface.removeColumn("users", "firstLoginCompleted");
    }
    if (columns.phone) {
      await queryInterface.removeColumn("users", "phone");
    }
  },
};
