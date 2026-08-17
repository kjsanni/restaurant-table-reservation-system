"use strict";

// WARNING: This migration modifies the ENUM column on the tenants table.
// On MySQL, ALTER TABLE ... MODIFY COLUMN ENUM(...) rebuilds the table and
// acquires an exclusive lock. Run this only during a maintenance window
// when the tenants table can tolerate a brief write pause.

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("tenants");
    const currentType = columns.businessVertical?.type || "";

    if (!currentType.includes("event")) {
      await queryInterface.sequelize.query(
        "ALTER TABLE tenants MODIFY COLUMN businessVertical ENUM('restaurant', 'salon', 'event') NOT NULL DEFAULT 'restaurant'"
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE tenants MODIFY COLUMN businessVertical ENUM('restaurant', 'salon') NOT NULL DEFAULT 'restaurant'"
    );
  },
};
