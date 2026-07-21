const deliveryService = require("../services/delivery.service");
const shaqExpressService = require("../services/shaqexpress.service");
const orderDAO = require("../DAOs/order.dao");
const deliveryDAO = require("../DAOs/delivery.dao");
const { cache } = require("../utils/cache");

jest.mock("../services/shaqexpress.service");
jest.mock("../DAOs/order.dao");
jest.mock("../DAOs/delivery.dao");
jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

const shaq = require("../services/shaqexpress.service");
const orderDao = require("../DAOs/order.dao");
const deliveryDao = require("../DAOs/delivery.dao");
const { cache: mockCache } = require("../utils/cache");

describe("delivery.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue("OK");
    mockCache.del.mockResolvedValue(1);
  });

  describe("createDelivery", () => {
    it("creates a delivery and updates order with tracking number", async () => {
      orderDao.getOrderById.mockResolvedValue({
        id: 1,
        total: "50.00",
        orderItems: [{ menuItemId: 1, quantity: 2 }],
        customer: { firstName: "Kwame", phone: "+233241234567" },
      });
      shaq.createPackage.mockResolvedValue({
        data: {
          trackingNumber: "SHAQ123",
          status: "pending",
          statusDescription: "Pending",
          tracking: [],
        },
      });
      deliveryDao.createDelivery.mockResolvedValue({
        id: 1,
        partnerRef: "ORD-1-123",
        trackingNumber: "SHAQ123",
      });
      deliveryDao.updateDelivery.mockResolvedValue({});

      const delivery = await deliveryService.createDelivery(1, 1, {
        customerName: "Kwame",
        customerPhone: "+233241234567",
        region: "Greater Accra",
        city: "Accra",
        address: "123 Main St",
      });

      expect(delivery.trackingNumber).toBe("SHAQ123");
      expect(orderDao.updateOrder).toHaveBeenCalledWith(1, 1, {
        deliveryStatus: "pending",
        trackingNumber: "SHAQ123",
      });
    });

    it("throws 404 when order not found", async () => {
      orderDao.getOrderById.mockResolvedValue(null);

      await expect(deliveryService.createDelivery(1, 999, {})).rejects.toMatchObject({
        status: 404,
        message: "Order not found",
      });
    });
  });

  describe("syncDeliveryStatus", () => {
    it("syncs delivery status from Shaq Express", async () => {
      deliveryDao.getDeliveryById.mockResolvedValue({
        id: 1,
        partnerRef: "REF-1",
        tenantId: 1,
      });
      shaq.getPackage.mockResolvedValue({
        data: {
          status: "in_transit",
          statusDescription: "In transit",
          trackingNumber: "SHAQ123",
          trackingHistory: [{ name: "in_transit", date: "2025-01-01" }],
        },
      });
      deliveryDao.updateDelivery.mockImplementation((id, tenantId, updates) =>
        Promise.resolve({ id, ...updates })
      );

      const delivery = await deliveryService.syncDeliveryStatus(1, 1);

      expect(delivery.status).toBe("in_transit");
      expect(delivery.trackingNumber).toBe("SHAQ123");
    });
  });

  describe("cancelDelivery", () => {
    it("cancels delivery via Shaq Express and updates local status", async () => {
      deliveryDao.getDeliveryById.mockResolvedValue({
        id: 1,
        partnerRef: "REF-1",
        tenantId: 1,
      });
      shaq.cancelPackage.mockResolvedValue({});
      deliveryDao.updateDelivery.mockImplementation((id, tenantId, updates) =>
        Promise.resolve({ id, ...updates })
      );

      const delivery = await deliveryService.cancelDelivery(1, 1);

      expect(delivery.status).toBe("cancelled");
      expect(shaq.cancelPackage).toHaveBeenCalledWith(1, "REF-1");
    });
  });

  describe("handleShaqExpressWebhook", () => {
    it("updates delivery and order status on delivered webhook", async () => {
      deliveryDao.getDeliveryByPartnerRef.mockResolvedValue({
        id: 1,
        orderId: 10,
        tenantId: 1,
        status: "in_transit",
      });
      orderDao.getOrderById.mockResolvedValue({ id: 10 });
      deliveryDao.updateDelivery.mockResolvedValue({});
      orderDao.updateOrder.mockResolvedValue({});

      const result = await deliveryService.handleShaqExpressWebhook(
        {
          event: "package.status_updated",
          data: {
            partner_ref: "REF-1",
            tracking_number: "SHAQ123",
            status: "delivered",
            description: "Delivered",
            meta: { proof_url: "https://proof.jpg" },
          },
        },
        1
      );

      expect(result.status).toBe("OK");
      expect(orderDao.updateOrder).toHaveBeenCalledWith(10, 1, { deliveryStatus: "delivered" });
    });
  });
});
