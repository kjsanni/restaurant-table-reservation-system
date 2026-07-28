"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff', 'customer') NOT NULL DEFAULT 'staff'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff'"
    );
  },
};
