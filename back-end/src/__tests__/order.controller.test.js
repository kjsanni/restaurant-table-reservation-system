jest.mock("../DAOs/order.dao");
jest.mock("../DAOs/menu.dao");
jest.mock("../tenant-platform/services/paystack.service", () => ({
  initializeCharge: jest.fn().mockResolvedValue({ authorization_url: "https://paystack.co/pay/123", access_code: "abc", reference: "ref" }),
  verifyWebhookSignature: jest.fn().mockResolvedValue(true),
  verifyPayment: jest.fn().mockResolvedValue({ status: true }),
}));

const orderDAO = require("../DAOs/order.dao");
const menuDAO = require("../DAOs/menu.dao");
const orderController = require("../controllers/order.controller");
const db = require("../db/models");

describe("order.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { tenant: { id: 1 }, user: { customerId: 5 }, params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
    db.tenant = {
      findByPk: jest.fn().mockResolvedValue({ id: 1 }),
    };
  });

  describe("createOrderHandler", () => {
    it("should create order with valid items", async () => {
      menuDAO.getMenuItemById.mockResolvedValue({ id: 1, name: "Jollof", price: 25, isAvailable: true });
      orderDAO.createOrder.mockResolvedValue({ id: 1, total: "50.00" });

      req.body = {
        items: [{ menuItemId: 1, quantity: 2, unitPrice: 25 }],
      };
      await orderController.createOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: { id: 1, total: "50.00" } });
    });

    it("should reject empty items", async () => {
      req.body = { items: [] };
      await orderController.createOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Order must contain at least one item." });
    });

    it("should reject unavailable menu item", async () => {
      menuDAO.getMenuItemById.mockResolvedValue({ id: 1, name: "Jollof", price: 25, isAvailable: false });
      req.body = {
        items: [{ menuItemId: 1, quantity: 1 }],
      };
      await orderController.createOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining("not available") });
    });
  });

  describe("getOrderHandler", () => {
    it("should return order when found", async () => {
      req.params.orderId = "1";
      orderDAO.getOrderById.mockResolvedValue({ id: 1, status: "submitted" });
      await orderController.getOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: { id: 1, status: "submitted" } });
    });

    it("should return 404 when order not found", async () => {
      req.params.orderId = "999";
      orderDAO.getOrderById.mockResolvedValue(null);
      await orderController.getOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getOrdersHandler", () => {
    it("should return paginated orders", async () => {
      req.query = { page: "1", pageSize: "10" };
      orderDAO.getOrders.mockResolvedValue({
        orders: [{ id: 1 }],
        total: 1,
      });
      await orderController.getOrdersHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: [{ id: 1 }],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe("cancelOrderHandler", () => {
    it("should cancel order", async () => {
      req.params.orderId = "1";
      orderDAO.cancelOrder.mockResolvedValue({ id: 1, status: "cancelled" });
      await orderController.cancelOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: { id: 1, status: "cancelled" } });
    });

    it("should return 400 when order cannot be cancelled", async () => {
      req.params.orderId = "1";
      orderDAO.cancelOrder.mockRejectedValue({ status: 400, message: "Order cannot be cancelled" });
      await orderController.cancelOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("initializeOrderPaymentHandler", () => {
    it("should initialize Paystack charge", async () => {
      req.params.orderId = "1";
      req.body = { email: "test@example.com", amount: 50 };
      orderDAO.getOrderById.mockResolvedValue({ id: 1, total: "50.00" });
      await orderController.initializeOrderPaymentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        authorizationUrl: "https://paystack.co/pay/123",
        accessCode: "abc",
        reference: "ref",
      });
    });
  });

  describe("getOrderPaymentsHandler", () => {
    it("should return payments for order", async () => {
      req.params.orderId = "1";
      orderDAO.getOrderPayments.mockResolvedValue([{ id: 1, amount: 50 }]);
      await orderController.getOrderPaymentsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, payments: [{ id: 1, amount: 50 }] });
    });
  });

  describe("addOrderPaymentHandler", () => {
    it("should add payment and update totals", async () => {
      req.params.orderId = "1";
      req.body = { amount: 20, method: "cash" };
      orderDAO.addOrderPayment.mockResolvedValue({ payment: { id: 2, amount: 20 }, totalPaid: 20, order: { id: 1, paymentStatus: "partial" } });
      await orderController.addOrderPaymentHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        payment: { id: 2, amount: 20 },
        totalPaid: 20,
        order: { id: 1, paymentStatus: "partial" },
      });
    });
  });

  describe("applyDiscountHandler", () => {
    it("should apply discount to order", async () => {
      req.params.orderId = "1";
      req.body = { discountType: "percentage", discountValue: 10, discountCode: "SAVE10" };
      orderDAO.updateOrder.mockResolvedValue({ id: 1, discountType: "percentage", discountValue: 10, discountCode: "SAVE10" });
      await orderController.applyDiscountHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: { id: 1, discountType: "percentage", discountValue: 10, discountCode: "SAVE10" } });
    });
  });

  describe("getOrderStatsHandler", () => {
    it("should return order analytics", async () => {
      orderDAO.getOrderStats.mockResolvedValue({ totalOrders: 10, totalRevenue: 500, avgOrderValue: 50, statusBreakdown: [], paymentBreakdown: [] });
      await orderController.getOrderStatsHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, stats: { totalOrders: 10, totalRevenue: 500, avgOrderValue: 50, statusBreakdown: [], paymentBreakdown: [] } });
    });
  });

  describe("updateOrderHandler", () => {
    it("should update order status", async () => {
      req.params.orderId = "1";
      req.body = { status: "completed" };
      orderDAO.getOrderById.mockResolvedValue({ id: 1, status: "submitted" });
      orderDAO.updateOrder.mockResolvedValue({ id: 1, status: "completed" });
      await orderController.updateOrderHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, order: { id: 1, status: "completed" } });
    });
  });

  describe("searchOrdersHandler", () => {
    it("should search orders by query", async () => {
      req.query = { q: "jollof" };
      orderDAO.searchOrders.mockResolvedValue([{ id: 1 }]);
      await orderController.searchOrdersHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, results: [{ id: 1 }] });
    });
  });
});
