"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff'"
    );

    await queryInterface.addColumn("users", "permissions", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        view_reservations: true,
        edit_reservations: true,
        manage_tables: true,
        manage_schedule: false,
        manage_staff: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM("admin", "staff"),
      defaultValue: "staff",
    });

    await queryInterface.removeColumn("users", "permissions");
  },
};