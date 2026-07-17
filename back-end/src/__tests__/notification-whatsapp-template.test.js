const notificationService = require("../services/notification.service");

describe("buildWhatsAppText template rendering", () => {
  const data = {
    name: "Jane",
    date: "2026-07-20",
    time: "7:30 PM",
    partySize: 4,
    table: "T12",
    restaurantName: "Bistro",
  };

  it("substitutes variables from a custom whatsapp_reminder template", () => {
    const template = "Hello {{name}}, table {{table}} at {{time}} on {{date}} ({{partySize}}).";
    const text = notificationService.buildWhatsAppText(data, template);
    expect(text).toBe("Hello Jane, table T12 at 7:30 PM on 2026-07-20 (4).");
  });

  it("falls back to the default template when none is provided", () => {
    const text = notificationService.buildWhatsAppText(data);
    expect(text).toContain("Hi Jane");
    expect(text).toContain("T12");
    expect(text).toContain("Bistro");
  });

  it("leaves unknown variables as empty", () => {
    const text = notificationService.buildWhatsAppText(data, "Hi {{unknown}}!");
    expect(text).toBe("Hi !");
  });
});
