const messageTemplates = require("../services/messageTemplates.service");

jest.mock("../DAOs/auth.dao");

const authDAO = require("../DAOs/auth.dao");

describe("messageTemplates.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    messageTemplates.invalidateCache();
    authDAO.getSettingValue.mockResolvedValue(null);
  });

  describe("render", () => {
    it("renders a default template with variable substitution", async () => {
      const result = await messageTemplates.render("reservation_confirmed", {
        reservationId: 42,
        resDate: "2026-08-01",
        resTime: "19:00",
      });

      expect(result).toContain("Reservation #42");
      expect(result).toContain("2026-08-01");
      expect(result).toContain("19:00");
    });

    it("loads custom templates from DB setting and overrides defaults", async () => {
      authDAO.getSettingValue.mockResolvedValue({
        welcome: "Custom welcome {{name}}!",
      });

      const result = await messageTemplates.render("welcome", { name: "Kofi" });

      expect(result).toBe("Custom welcome Kofi!");
      expect(authDAO.getSettingValue).toHaveBeenCalledWith(
        "whatsapp_message_templates",
        null,
        null
      );
    });

    it("caches templates for 60 seconds to avoid repeated DB calls", async () => {
      authDAO.getSettingValue.mockResolvedValue({ welcome: "Cached" });

      await messageTemplates.render("welcome", {}, 1);
      await messageTemplates.render("reservation_start", {}, 1);
      await messageTemplates.render("no_orders", {}, 1);

      expect(authDAO.getSettingValue).toHaveBeenCalledTimes(1);
    });

    it("separates cache by tenantId", async () => {
      authDAO.getSettingValue.mockResolvedValue({ welcome: "Tenant 1" });

      await messageTemplates.render("welcome", {}, 1);
      await messageTemplates.render("welcome", {}, 2);

      expect(authDAO.getSettingValue).toHaveBeenCalledTimes(2);
      expect(authDAO.getSettingValue).toHaveBeenNthCalledWith(1, "whatsapp_message_templates", null, 1);
      expect(authDAO.getSettingValue).toHaveBeenNthCalledWith(2, "whatsapp_message_templates", null, 2);
    });

    it("falls back to defaults when DB setting is not found", async () => {
      authDAO.getSettingValue.mockResolvedValue(null);

      const result = await messageTemplates.render("no_orders", {});

      expect(result).toContain("No orders found");
    });

    it("falls back to defaults when DB throws", async () => {
      authDAO.getSettingValue.mockRejectedValue(new Error("DB down"));

      const result = await messageTemplates.render("welcome", {});

      expect(result).toContain("Make a reservation");
    });

    it("throws for unknown template names", async () => {
      await expect(messageTemplates.render("nonexistent_template", {})).rejects.toThrow(
        "Unknown message template: nonexistent_template"
      );
    });

    it("handles missing variables by replacing with empty string", async () => {
      const result = await messageTemplates.render("reservation_confirmed", {
        reservationId: 10,
      });

      expect(result).toContain("Reservation #10");
      expect(result).not.toContain("{{resDate}}");
      expect(result).not.toContain("{{resTime}}");
    });
  });

  describe("substitute", () => {
    it("replaces single variable", () => {
      const result = messageTemplates.substitute("Hello {{name}}!", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    it("replaces multiple variables", () => {
      const result = messageTemplates.substitute("{{a}} and {{b}}", { a: "X", b: "Y" });
      expect(result).toBe("X and Y");
    });

    it("handles whitespace in variable syntax", () => {
      const result = messageTemplates.substitute("Hi {{ name }}", { name: "Kofi" });
      expect(result).toBe("Hi Kofi");
    });

    it("replaces all occurrences of same variable", () => {
      const result = messageTemplates.substitute("{{x}} {{x}} {{x}}", { x: "A" });
      expect(result).toBe("A A A");
    });

    it("replaces undefined variables with empty string", () => {
      const result = messageTemplates.substitute("Hello {{missing}}!", {});
      expect(result).toBe("Hello !");
    });

    it("converts numeric values to string", () => {
      const result = messageTemplates.substitute("Order #{{id}}", { id: 42 });
      expect(result).toBe("Order #42");
    });

    it("does not modify template when no variables provided", () => {
      const result = messageTemplates.substitute("No variables here", {});
      expect(result).toBe("No variables here");
    });
  });

  describe("DEFAULT_TEMPLATES", () => {
    it("has all required template keys", () => {
      const requiredKeys = [
        "welcome",
        "reservation_start",
        "reservation_date_invalid",
        "reservation_date_ok",
        "reservation_time_invalid",
        "reservation_time_ok",
        "reservation_people_invalid",
        "reservation_people_ok",
        "reservation_confirm",
        "reservation_confirmed",
        "reservation_failed",
        "reservation_cancelled",
        "delivery_start",
        "delivery_location_prompt",
        "delivery_location_received",
        "delivery_location_shared",
        "delivery_location_retry",
        "delivery_order_created",
        "delivery_payment_pending",
        "delivery_tracking",
        "no_orders",
        "order_status",
        "order_created",
        "session_cleared",
        "agent_handoff",
        "unrecognized",
        "service_unavailable",
      ];

      for (const key of requiredKeys) {
        expect(messageTemplates.DEFAULT_TEMPLATES[key]).toBeDefined();
      }
    });

    it("welcome template includes all 4 menu options", () => {
      const welcome = messageTemplates.DEFAULT_TEMPLATES.welcome;
      expect(welcome).toContain("1. Make a reservation");
      expect(welcome).toContain("2. Order delivery");
      expect(welcome).toContain("3. Check order status");
      expect(welcome).toContain("4. Talk to someone");
    });
  });

  describe("invalidateCache", () => {
    it("clears the cache so next render reloads from DB", async () => {
      authDAO.getSettingValue.mockResolvedValue({ welcome: "Cached" });

      await messageTemplates.render("welcome", {}, 1);
      expect(authDAO.getSettingValue).toHaveBeenCalledTimes(1);

      messageTemplates.invalidateCache();

      await messageTemplates.render("welcome", {}, 1);
      expect(authDAO.getSettingValue).toHaveBeenCalledTimes(2);
    });
  });
});
