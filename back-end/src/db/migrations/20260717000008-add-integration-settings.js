"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const settings = [
      {
        key: "whatsapp_config",
        value: JSON.stringify({
          enabled: false,
          token: "",
          phoneNumberId: "",
        }),
        description: "WhatsApp Business API credentials and enable flag",
      },
      {
        key: "notification_channels",
        value: JSON.stringify({ email: true, whatsapp: false }),
        description: "Enabled notification channels for reservations",
      },
      {
        key: "paystack_config",
        value: JSON.stringify({
          mode: "test",
          secretKey: "",
          webhookSecret: "",
        }),
        description: "Platform-level Paystack API credentials (tenants may override)",
      },
      {
        key: "tenant_mode_enabled",
        value: JSON.stringify(false),
        description: "Enable multi-tenant mode (SaaS). Requires TENANT_MODE=enabled to take effect.",
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
      key: [
        "whatsapp_config",
        "notification_channels",
        "paystack_config",
        "tenant_mode_enabled",
      ],
    });
  },
};
