"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const settings = [
      {
        key: "email_theme",
        value: JSON.stringify({
          brandName: "Restaurant",
          logoUrl: "",
          primaryColor: "#3b82f6",
          footerText: "Thank you for dining with us!",
        }),
        description: "Email theme/branding settings",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "email_templates",
        value: JSON.stringify({
          reservation_confirmation: {
            subject: "Reservation Confirmed",
            html: "<p>Hi {{customerName}},</p><p>Your reservation for {{partySize}} on {{resDate}} at {{resTime}} is confirmed.</p><p>Table: {{tableName}}</p>",
          },
          reservation_cancelled: {
            subject: "Reservation Cancelled",
            html: "<p>Hi {{customerName}},</p><p>Your reservation for {{resDate}} at {{resTime}} has been cancelled.</p>",
          },
          waitlist_promoted: {
            subject: "Table Ready",
            html: "<p>Hi {{customerName}},</p><p>A table for {{partySize}} is now ready. Please proceed to the host stand.</p>",
          },
        }),
        description: "Editable email templates (subject + HTML)",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    for (const s of settings) {
      const existing = await queryInterface.rawSelect("settings", { where: { key: s.key } }, "id");
      if (!existing) await queryInterface.bulkInsert("settings", [s]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("settings", { key: ["email_theme", "email_templates"] });
  },
};