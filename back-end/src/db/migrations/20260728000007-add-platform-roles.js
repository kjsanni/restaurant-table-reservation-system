"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const hasColumn = await queryInterface.describeTable("users").then(
      (cols) => cols.platformRoles !== undefined,
      () => false
    );

    if (!hasColumn) {
      await queryInterface.addColumn("users", "platformRoles", {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "platformRoles");
  },
};
