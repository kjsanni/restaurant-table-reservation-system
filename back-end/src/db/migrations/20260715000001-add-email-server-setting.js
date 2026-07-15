"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.rawSelect(
      "settings",
      { where: { key: "email_server" } },
      "id"
    );
    if (!existing) {
      await queryInterface.bulkInsert("settings", [
        {
          key: "email_server",
          value: JSON.stringify({
            host: "",
            port: 587,
            secure: false,
            user: "",
            pass: "",
            from: "",
          }),
          description: "SMTP server configuration for sending emails (loaded from database)",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("settings", { key: "email_server" });
  },
};
