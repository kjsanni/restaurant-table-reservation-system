"use strict";

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.rawSelect(
      "settings",
      { where: { key: "pos_sync" } },
      "id"
    );
    if (!existing) {
      await queryInterface.bulkInsert("settings", [
        {
          key: "pos_sync",
          value: JSON.stringify({ enabled: false, posApiUrl: "", posApiKey: "" }),
          description: "BV360 POS integration: table sync, reservation→POS order, payment settlement",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("settings", { key: "pos_sync" });
  },
};
