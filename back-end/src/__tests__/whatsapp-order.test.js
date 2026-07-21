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
      no_orders: "No orders found.",
      session_cleared: "Session cleared.",
      unrecognized: "I didn't understand.",
      order_created: `Order #${vars?.orderId || 0} created!\nPay here: ${vars?.paymentLink || ""}\n\nYou'll receive confirmation once paid.`,
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
const promotionService = require("../services/promotion.service");
const { initializeCharge } = require("../tenant-platform/services/paystack.service");
const { cache } = require("../utils/cache");

describe("whatsapp-order.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
    cache.del.mockResolvedValue(1);
  });

  describe("processMessage", () => {
    it("starts menu flow on 'menu'", async () => {
      menuService.getMenuCategories.mockResolvedValue([{ id: 1, name: "Mains" }]);
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "menu", 1);

      expect(menuService.getMenuCategories).toHaveBeenCalledWith(1);
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Welcome"),
        1
      );
    });

    it("shows items for a category selection", async () => {
      cache.get.mockResolvedValueOnce({ state: "browsing", tenantId: 1 }).mockResolvedValueOnce(null);
      menuService.getMenuCategories.mockResolvedValue([{ id: 1, name: "Mains" }]);
      menuService.getMenuItems.mockResolvedValue([{ id: 1, name: "Jollof", price: 25, isAvailable: true }]);
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "1", 1);

      expect(menuService.getMenuItems).toHaveBeenCalledWith(1, { categoryId: 1, isAvailable: true });
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Jollof"),
        1
      );
    });

    it("adds item to cart and shows cart summary", async () => {
      cache.get.mockResolvedValueOnce({ state: "items", categoryId: 1, tenantId: 1 });
      menuService.getMenuCategories.mockResolvedValue([]);
      menuService.getMenuItems.mockResolvedValue([{ id: 1, name: "Jollof", price: 25, isAvailable: true }]);
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "1", 1);

      expect(cache.set).toHaveBeenCalledWith(
        "whatsapp:cart:+233241234567",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ menuItemId: 1, name: "Jollof" }),
          ]),
        }),
        86400
      );
    });

    it("creates order and returns payment link on checkout", async () => {
      cache.get.mockResolvedValueOnce({ state: "checkout", tenantId: 1 }).mockResolvedValueOnce({
        items: [{ menuItemId: 1, name: "Jollof", price: 25, quantity: 1 }],
        discountCode: null,
      });
      customerService.searchCustomers.mockResolvedValue([]);
      customerService.findOrCreateCustomer.mockResolvedValue({ id: 10, phone: "+233241234567" });
      orderService.createOrder.mockResolvedValue({ id: 100, total: "25.00" });
      initializeCharge.mockResolvedValue({ authorization_url: "https://paystack.co/pay/100" });
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "pay", 1);

      expect(orderService.createOrder).toHaveBeenCalledWith(1, {
        customerId: 10,
        items: [{ menuItemId: 1, quantity: 1 }],
        status: "pending",
        paymentStatus: "unpaid",
      });
      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("https://paystack.co/pay/100"),
        1
      );
    });
  });

  describe("cart management", () => {
    it("shows empty cart message", async () => {
      cache.get.mockImplementation((key) => {
        if (key.startsWith("whatsapp:session:")) {
          return Promise.resolve({ state: "browsing", tenantId: 1 });
        }
        if (key.startsWith("whatsapp:cart:")) {
          return Promise.resolve({ items: [], discountCode: null });
        }
        return Promise.resolve(null);
      });
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "cart", 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        "Your cart is empty.",
        1
      );
    });
  });

  describe("help command", () => {
    it("shows help text", async () => {
      whatsappService.sendWhatsAppText.mockResolvedValue({});

      await whatsappOrderService.processMessage("+233241234567", "help", 1);

      expect(whatsappService.sendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("Commands:"),
        1
      );
    });
  });
});
