const whatsappOrderService = require("../services/whatsapp-order.service");

jest.mock("../services/whatsapp.service");
jest.mock("../services/menu.service");
jest.mock("../services/order.service");
jest.mock("../services/customerService");
jest.mock("../services/promotion.service");
jest.mock("../services/geocoding.service");
jest.mock("../services/reservationService");
jest.mock("../services/delivery.service");
jest.mock("../services/messageTemplates.service", () => ({
  render: jest.fn(async (name, vars) => {
    const defaults = {
      welcome: "Welcome menu",
      reservation_start: "book a table",
      reservation_date_invalid: "couldn't understand that date",
      reservation_date_ok: "What time?",
      reservation_time_invalid: "couldn't understand that time",
      reservation_time_ok: "How many people?",
      reservation_people_invalid: "number (1 or more)",
      reservation_people_ok: "special requests or notes",
      reservation_confirm: "reservation summary",
      reservation_confirmed: `Confirmed! Reservation #${vars?.reservationId || ""}.\nSee you ${vars?.resDate || ""} at ${vars?.resTime || ""}.`,
      reservation_failed: "Could not create reservation",
      reservation_cancelled: "cancelled",
      session_cleared: "Session cleared",
      unrecognized: "didn't understand",
    };
    let text = defaults[name] || name;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{{${k}}}`, String(v));
      }
    }
    return text;
  }),
}));
jest.mock("../tenant-platform/services/paystack.service", () => ({
  initializeCharge: jest.fn().mockResolvedValue({ authorization_url: "https://paystack.co/pay/123" }),
}));
jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

const whatsappService = require("../services/whatsapp.service");
const reservationService = require("../services/reservationService");
const { cache } = require("../utils/cache");

describe("whatsapp-order.service — reservation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
    cache.del.mockResolvedValue(1);
    whatsappService.sendWhatsAppText.mockResolvedValue({});
    whatsappService.formatPhoneNumber.mockImplementation((p) => p);
  });

  const setSessionState = (state, extra = {}) => {
    cache.get.mockImplementation((key) => {
      if (key.startsWith("whatsapp:session:")) {
        return Promise.resolve({ state, tenantId: 1, ...extra });
      }
      if (key.startsWith("whatsapp:cart:")) {
        return Promise.resolve({ items: [], discountCode: null });
      }
      return Promise.resolve(null);
    });
  };

  it("shows welcome menu on 'hi'", async () => {
    await whatsappOrderService.processMessage("+233241234567", "hi", 1);

    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      "Welcome menu",
      1
    );
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "welcome" }),
      86400
    );
  });

  it("starts reservation flow when user replies '1' from welcome", async () => {
    setSessionState("welcome");

    await whatsappOrderService.processMessage("+233241234567", "1", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_date", flow: "reservation" }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("book a table"),
      1
    );
  });

  it("parses 'tomorrow' as a valid reservation date", async () => {
    setSessionState("reservation_date", { flow: "reservation" });

    await whatsappOrderService.processMessage("+233241234567", "tomorrow", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_time", resDate: expect.any(String) }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("What time?"),
      1
    );
  });

  it("rejects invalid date and asks again", async () => {
    setSessionState("reservation_date", { flow: "reservation" });

    await whatsappOrderService.processMessage("+233241234567", "xyz123", 1);

    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("couldn't understand that date"),
      1
    );
  });

  it("parses '7pm' as a valid time", async () => {
    setSessionState("reservation_time", { flow: "reservation", resDate: "2026-08-01" });

    await whatsappOrderService.processMessage("+233241234567", "7pm", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_people", resTime: "19:00:00" }),
      86400
    );
  });

  it("parses party size and moves to notes", async () => {
    setSessionState("reservation_people", { flow: "reservation", resDate: "2026-08-01", resTime: "19:00:00" });

    await whatsappOrderService.processMessage("+233241234567", "4", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_notes", people: 4 }),
      86400
    );
  });

  it("collects notes and shows confirmation summary", async () => {
    setSessionState("reservation_notes", {
      flow: "reservation",
      resDate: "2026-08-01",
      resTime: "19:00:00",
      people: 4,
    });

    await whatsappOrderService.processMessage("+233241234567", "window seat please", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_confirm", notes: "window seat please" }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("reservation summary"),
      1
    );
  });

  it("treats 'skip' as no notes", async () => {
    setSessionState("reservation_notes", {
      flow: "reservation",
      resDate: "2026-08-01",
      resTime: "19:00:00",
      people: 4,
    });

    await whatsappOrderService.processMessage("+233241234567", "skip", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "reservation_confirm", notes: null }),
      86400
    );
  });

  it("creates reservation on 'yes' confirmation and returns confirmation message", async () => {
    setSessionState("reservation_confirm", {
      flow: "reservation",
      resDate: "2026-08-01",
      resTime: "19:00:00",
      people: 4,
      notes: "window seat",
    });
    reservationService.createFromWhatsApp.mockResolvedValue({ id: 42 });

    await whatsappOrderService.processMessage("+233241234567", "yes", 1);

    expect(reservationService.createFromWhatsApp).toHaveBeenCalledWith(
      1,
      "+233241234567",
      { resDate: "2026-08-01", resTime: "19:00:00", people: 4, notes: "window seat" }
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("Confirmed! Reservation #42"),
      1
    );
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "idle" }),
      86400
    );
  });

  it("cancels reservation on 'no' and returns to idle", async () => {
    setSessionState("reservation_confirm", {
      flow: "reservation",
      resDate: "2026-08-01",
      resTime: "19:00:00",
      people: 4,
    });

    await whatsappOrderService.processMessage("+233241234567", "no", 1);

    expect(reservationService.createFromWhatsApp).not.toHaveBeenCalled();
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("cancelled"),
      1
    );
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "idle" }),
      86400
    );
  });

  it("handles reservation creation failure gracefully", async () => {
    setSessionState("reservation_confirm", {
      flow: "reservation",
      resDate: "2026-08-01",
      resTime: "19:00:00",
      people: 4,
    });
    reservationService.createFromWhatsApp.mockRejectedValue({ message: "Restaurant closed" });

    await whatsappOrderService.processMessage("+233241234567", "yes", 1);

    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("Could not create reservation"),
      1
    );
  });
});
