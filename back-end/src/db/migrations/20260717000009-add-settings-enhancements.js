"use strict";

module.exports = {
  async up(queryInterface) {
    const settings = [
      {
        key: "maintenance_mode",
        value: JSON.stringify({ enabled: false, message: "" }),
        description: "Global maintenance mode — closes online booking",
      },
      {
        key: "currency_locale",
        value: JSON.stringify({ currency: "GHS", locale: "en-GH" }),
        description: "Display currency code and locale for formatting",
      },
      {
        key: "reservation_window",
        value: JSON.stringify({
          minLeadMinutes: 0,
          maxLeadDays: 365,
          maxPerSlot: 1,
        }),
        description:
          "Booking constraints: minimum lead time, max advance days, max reservations per slot",
      },
      {
        key: "branding",
        value: JSON.stringify({
          logoUrl: "",
          brandName: "",
          primaryColor: "",
        }),
        description: "Restaurant branding: logo, name, primary color",
      },
      {
        key: "message_templates",
        value: JSON.stringify({
          whatsapp_reminder:
            "Hi {{name}},\n\nThis is a reminder for your reservation on {{date}} at {{time}} for {{partySize}} people.\nTable: {{table}}\n{{restaurantName}}\n\nSee you soon!",
          email_confirmation_subject: "Reservation Confirmed – {{customer_name}}",
          email_confirmation_body:
            "Hi {{customer_name}}, your reservation is confirmed for {{reservation_time}} for {{party_size}} guests at table {{table_name}}.",
        }),
        description: "Per-channel message templates for notifications",
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
        "maintenance_mode",
        "currency_locale",
        "reservation_window",
        "branding",
        "message_templates",
      ],
    });
  },
};
