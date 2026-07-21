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
      delivery_start: "delivery",
      delivery_location_prompt: "Share your location",
      delivery_location_received: "Got it!",
      delivery_location_shared: "Got your location\n{{address}}",
      delivery_location_retry: "couldn't find that address",
      delivery_order_created: `Order #${vars?.orderId || 0} created!\nPay here: ${vars?.paymentLink || ""}\n\nYou'll receive a tracking number once payment is confirmed.`,
      delivery_payment_pending: "awaiting payment",
      delivery_confirm_items: "Confirm order?",
      no_orders: "No orders found.",
      session_cleared: "Session cleared",
      unrecognized: "didn't understand",
      service_unavailable: "service not configured",
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
const menuService = require("../services/menu.service");
const orderService = require("../services/order.service");
const customerService = require("../services/customerService");
const geocodingService = require("../services/geocoding.service");
const { initializeCharge } = require("../tenant-platform/services/paystack.service");
const { cache } = require("../utils/cache");

describe("whatsapp-order.service — delivery flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
    cache.del.mockResolvedValue(1);
    whatsappService.sendWhatsAppText.mockResolvedValue({});
    whatsappService.formatPhoneNumber.mockImplementation((p) => p);
    geocodingService.resolveRegionFromCoords.mockReturnValue("Greater Accra");
    geocodingService.reverseGeocode.mockResolvedValue({
      address: "Accra, Ghana",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      latitude: 5.6037,
      longitude: -0.187,
    });
    geocodingService.geocodeAddress.mockResolvedValue({
      latitude: 5.6037,
      longitude: -0.187,
      address: "Near Methodist Church, Accra",
      region: "Greater Accra",
    });
  });

  const setSessionState = (state, extra = {}, cartData = null) => {
    cache.get.mockImplementation((key) => {
      if (key.startsWith("whatsapp:session:")) {
        return Promise.resolve({ state, tenantId: 1, ...extra });
      }
      if (key.startsWith("whatsapp:cart:")) {
        return Promise.resolve(cartData || { items: [], discountCode: null });
      }
      return Promise.resolve(null);
    });
  };

  it("starts delivery flow when user replies '2' from welcome", async () => {
    setSessionState("welcome");
    menuService.getMenuCategories.mockResolvedValue([{ id: 1, name: "Mains" }]);

    await whatsappOrderService.processMessage("+233241234567", "2", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "browsing", flow: "delivery" }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("delivery"),
      1
    );
  });

  it("routes delivery checkout to delivery_confirm_items (not order checkout)", async () => {
    const cart = {
      items: [{ menuItemId: 1, name: "Jollof Rice", price: 60, quantity: 2 }],
      discountCode: null,
    };
    setSessionState("browsing", { flow: "delivery", categoryId: 1 }, cart);
    menuService.getMenuItems.mockResolvedValue([{ id: 1, name: "Jollof Rice", price: 60 }]);

    await whatsappOrderService.processMessage("+233241234567", "checkout", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "delivery_confirm_items" }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("Confirm order?"),
      1
    );
  });

  it("confirms items and asks for location", async () => {
    setSessionState("delivery_confirm_items", { flow: "delivery" });

    await whatsappOrderService.processMessage("+233241234567", "yes", 1);

    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "delivery_location" }),
      86400
    );
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("Share your location"),
      1
    );
  });

  it("geocodes a typed address in delivery_location state", async () => {
    setSessionState("delivery_location", { flow: "delivery" });

    await whatsappOrderService.processMessage("+233241234567", "Near Methodist Church, Accra", 1);

    expect(geocodingService.geocodeAddress).toHaveBeenCalledWith("Near Methodist Church, Accra");
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({
        state: "delivery_confirm_location",
        deliveryLocation: expect.objectContaining({
          address: "Near Methodist Church, Accra",
          region: "Greater Accra",
        }),
      }),
      86400
    );
  });

  it("asks to retry when address geocoding fails", async () => {
    setSessionState("delivery_location", { flow: "delivery" });
    geocodingService.geocodeAddress.mockResolvedValue(null);

    await whatsappOrderService.processMessage("+233241234567", "unknown place xyz", 1);

    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("couldn't find that address"),
      1
    );
  });

  it("creates order and payment link on location confirmation", async () => {
    const cart = {
      items: [{ menuItemId: 1, name: "Jollof Rice", price: 60, quantity: 2 }],
      discountCode: null,
    };
    setSessionState(
      "delivery_confirm_location",
      {
        flow: "delivery",
        deliveryLocation: {
          latitude: 5.6037,
          longitude: -0.187,
          address: "Accra, Ghana",
          region: "Greater Accra",
        },
      },
      cart
    );
    customerService.searchCustomers.mockResolvedValue([]);
    customerService.findOrCreateCustomer.mockResolvedValue({ id: 10, phone: "+233241234567", email: "test@test.com" });
    orderService.createOrder.mockResolvedValue({ id: 100, total: "120.00" });
    initializeCharge.mockResolvedValue({ authorization_url: "https://paystack.co/pay/100" });

    await whatsappOrderService.processMessage("+233241234567", "yes", 1);

    expect(orderService.createOrder).toHaveBeenCalledWith(1, expect.objectContaining({ customerId: 10 }));
    expect(initializeCharge).toHaveBeenCalled();
    expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
      "+233241234567",
      expect.stringContaining("https://paystack.co/pay/100"),
      1
    );
    expect(cache.set).toHaveBeenCalledWith(
      "whatsapp:session:+233241234567",
      expect.objectContaining({ state: "delivery_payment", orderId: 100 }),
      86400
    );
    expect(cache.del).toHaveBeenCalledWith("whatsapp:cart:+233241234567");
  });

  describe("processLocationMessage", () => {
    it("stores location and asks for confirmation in delivery_location state", async () => {
      setSessionState("delivery_location", { flow: "delivery" });

      await whatsappOrderService.processLocationMessage(
        "+233241234567",
        { latitude: 5.6037, longitude: -0.187, address: "Accra, Ghana" },
        1
      );

      expect(cache.set).toHaveBeenCalledWith(
        "whatsapp:session:+233241234567",
        expect.objectContaining({
          state: "delivery_confirm_location",
          deliveryLocation: expect.objectContaining({
            latitude: 5.6037,
            longitude: -0.187,
            address: "Accra, Ghana",
          }),
        }),
        86400
      );
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Got your location"),
        1
      );
    });

    it("reverse-geocodes when no address is provided", async () => {
      setSessionState("delivery_location", { flow: "delivery" });

      await whatsappOrderService.processLocationMessage(
        "+233241234567",
        { latitude: 5.6037, longitude: -0.187 },
        1
      );

      expect(geocodingService.reverseGeocode).toHaveBeenCalledWith(5.6037, -0.187);
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Accra, Ghana"),
        1
      );
    });

    it("acknowledges location received outside delivery flow", async () => {
      setSessionState("idle");

      await whatsappOrderService.processLocationMessage(
        "+233241234567",
        { latitude: 5.6037, longitude: -0.187, address: "Accra, Ghana" },
        1
      );

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Location received"),
        1
      );
    });
  });
});
