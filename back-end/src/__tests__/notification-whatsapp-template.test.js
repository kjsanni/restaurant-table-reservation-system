const notificationService = require("../services/notification.service");

jest.mock("../DAOs/auth.dao");
const authDAO = require("../DAOs/auth.dao");

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

describe("renderTemplate", () => {
  it("substitutes multiple placeholders", () => {
    expect(notificationService.renderTemplate("{{a}} {{b}}", { a: "1", b: "2" })).toBe("1 2");
  });

  it("returns empty string for null template", () => {
    expect(notificationService.renderTemplate(null, { a: "1" })).toBe("");
  });

  it("returns empty string for undefined template", () => {
    expect(notificationService.renderTemplate(undefined, { a: "1" })).toBe("");
  });
});

describe("getWhatsAppReminderTemplate fallback", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when message_templates setting is empty", async () => {
    authDAO.getSettingValue.mockResolvedValue(null);

    const template = await notificationService.getWhatsAppReminderTemplate("tenant-1");
    expect(template).toBeNull();
  });

  it("returns null when message_templates exists but whatsapp_reminder is missing", async () => {
    authDAO.getSettingValue.mockResolvedValue({ email_confirmation_subject: "Hi" });

    const template = await notificationService.getWhatsAppReminderTemplate("tenant-1");
    expect(template).toBeNull();
  });

  it("returns whatsapp_reminder when present", async () => {
    authDAO.getSettingValue.mockResolvedValue({ whatsapp_reminder: "Hello {{name}}" });

    const template = await notificationService.getWhatsAppReminderTemplate("tenant-1");
    expect(template).toBe("Hello {{name}}");
  });
});
