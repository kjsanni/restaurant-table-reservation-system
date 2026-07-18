"use strict";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultDays = {};
DAYS.forEach((d) => {
  defaultDays[d] = { open: "09:00", close: "22:00", closed: false };
});

module.exports = {
  async up(queryInterface) {
    const settings = [
      {
        key: "business_hours",
        value: JSON.stringify({ enabled: false, days: defaultDays }),
        description: "Weekly operating hours; reservations outside open windows are rejected",
      },
      {
        key: "feature_flags",
        value: JSON.stringify({
          waitlist: true,
          loyalty: false,
          deposits: false,
        }),
        description: "Toggle optional modules without code changes",
      },
      {
        key: "webhooks",
        value: JSON.stringify({ enabled: false, subscriptions: [] }),
        description: "Outbound webhook subscriptions for reservation/payment events",
      },
      {
        key: "pos_sync",
        value: JSON.stringify({ enabled: false, posApiUrl: "", posApiKey: "" }),
        description: "BV360 POS integration: table sync, reservation→POS order, payment settlement",
      },
    ];

    for (const s of settings) {
      const existing = await queryInterface.rawSelect(
        "settings",
        { where: { key: s.key } },
        "id"
      );
      if (!existing) {
        await queryInterface.bulkInsert("settings", [
          { ...s, createdAt: new Date(), updatedAt: new Date() },
        ]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("settings", {
      key: ["business_hours", "feature_flags", "webhooks", "pos_sync"],
    });
  },
};
