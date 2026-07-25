"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hasColumn = await queryInterface.describeTable("users").then(
      (cols) => cols.isSuperAdmin !== undefined,
      () => false
    );

    if (!hasColumn) {
      await queryInterface.addColumn("users", "isSuperAdmin", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "isSuperAdmin");
  },
};
