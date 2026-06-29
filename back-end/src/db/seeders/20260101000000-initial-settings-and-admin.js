"use strict";
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("settings", null, {});
    await queryInterface.bulkDelete("users", null, {});

    await queryInterface.bulkInsert("settings", [
      {
        key: "customer_registration_enabled",
        value: JSON.stringify(true),
        description: "Enable or disable customer self-registration",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "reservation_slot_duration",
        value: JSON.stringify(30),
        description: "Default reservation slot duration in minutes",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "max_party_size",
        value: JSON.stringify(20),
        description: "Maximum number of people per reservation",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "allow_past_reservations",
        value: JSON.stringify(false),
        description: "Allow reservations in the past",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "require_table_assignment",
        value: JSON.stringify(true),
        description: "Require table assignment on reservation creation",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    if (process.env.NODE_ENV !== "production") {
      const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);
      await queryInterface.bulkInsert("users", [
        {
          username: "admin",
          email: "admin@rtrs.com",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("settings", null, {});
    await queryInterface.bulkDelete("users", null, {});
  },
};