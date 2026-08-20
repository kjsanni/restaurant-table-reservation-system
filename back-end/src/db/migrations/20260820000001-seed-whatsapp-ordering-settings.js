"use strict";

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      'SELECT `key` FROM `settings` WHERE `key` IN (:keys)',
      {
        replacements: { keys: ["whatsapp_ordering_enabled", "whatsapp_ordering_hours"] },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      }
    );

    const existingKeys = new Set(existing.map((r) => r.key));
    const toInsert = [];

    if (!existingKeys.has("whatsapp_ordering_enabled")) {
      toInsert.push({
        key: "whatsapp_ordering_enabled",
        value: JSON.stringify(false),
        description: "Enable WhatsApp ordering channel for customers",
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (!existingKeys.has("whatsapp_ordering_hours")) {
      toInsert.push({
        key: "whatsapp_ordering_hours",
        value: JSON.stringify({
          monday: { enabled: true, open: "08:00", close: "22:00" },
          tuesday: { enabled: true, open: "08:00", close: "22:00" },
          wednesday: { enabled: true, open: "08:00", close: "22:00" },
          thursday: { enabled: true, open: "08:00", close: "22:00" },
          friday: { enabled: true, open: "08:00", close: "23:00" },
          saturday: { enabled: true, open: "09:00", close: "23:00" },
          sunday: { enabled: true, open: "10:00", close: "21:00" },
        }),
        description: "WhatsApp ordering hours per day of week",
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("settings", toInsert, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DELETE FROM `settings` WHERE `key` IN (:keys)',
      {
        replacements: {
          keys: ["whatsapp_ordering_enabled", "whatsapp_ordering_hours"],
        },
      }
    );
  },
};
