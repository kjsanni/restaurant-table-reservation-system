describe("billingController.webhookHandler", () => {
  let req;
  let res;
  let mockVerifyWebhookSignature;
  let mockSyncFromPaymentGateway;
  let mockCreateFromWhatsApp;
  let mockSendWhatsAppText;
  let mockRenderTemplate;
  let billingController;
  let db;
  let orderDAO;
  let paymentDAO;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    req = {
      headers: { "x-paystack-signature": "sig" },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockVerifyWebhookSignature = jest.fn().mockResolvedValue(true);
    mockSyncFromPaymentGateway = jest.fn().mockResolvedValue({});
    mockCreateFromWhatsApp = jest.fn().mockResolvedValue({ trackingNumber: "TRK123" });
    mockSendWhatsAppText = jest.fn().mockResolvedValue({});
    mockRenderTemplate = jest.fn().mockResolvedValue("Your order is on the way!\nTracking: TRK123\nYou'll receive status updates here.");

    jest.doMock("../tenant-platform/services/paystack.service", () => ({
      verifyWebhookSignature: mockVerifyWebhookSignature,
    }));

    jest.doMock("../tenant-platform/services/tenantSubscription.service", () => ({
      syncFromPaymentGateway: mockSyncFromPaymentGateway,
    }));

    jest.doMock("../services/delivery.service", () => ({
      createFromWhatsApp: mockCreateFromWhatsApp,
    }));

    jest.doMock("../services/whatsapp.service", () => ({
      sendWhatsAppText: mockSendWhatsAppText,
    }));

    jest.doMock("../services/messageTemplates.service", () => ({
      render: mockRenderTemplate,
    }));

    jest.doMock("../DAOs/order.dao", () => ({
      getOrderById: jest.fn(),
      updateOrder: jest.fn(),
    }));

    jest.doMock("../DAOs/payment.dao", () => ({
      create: jest.fn(),
      getOrderPayments: jest.fn(),
    }));

    db = require("../db/models");
    db.paystackEvent = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    db.tenant = {
      findOne: jest.fn().mockResolvedValue(null),
      findByPk: jest.fn().mockResolvedValue({ id: 1, update: jest.fn() }),
    };

    orderDAO = require("../DAOs/order.dao");
    paymentDAO = require("../DAOs/payment.dao");

    billingController = require("../tenant-platform/controllers/billing.controller");
  });

  it("returns 401 when webhook signature is invalid", async () => {
    mockVerifyWebhookSignature.mockResolvedValue(false);

    await billingController.webhookHandler(req, res);

    expect(mockVerifyWebhookSignature).toHaveBeenCalledWith(
      expect.any(String),
      "sig"
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid signature" });
  });

  it("skips duplicate events by paystackEventId", async () => {
    req.body = { id: "evt_123", event: "invoice.payment_succeeded", data: { metadata: { tenantId: 1 } } };

    db.paystackEvent.findOne.mockResolvedValue({ id: 1, paystackEventId: "evt_123" });

    await billingController.webhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Event already processed" });
    expect(mockSyncFromPaymentGateway).not.toHaveBeenCalled();
  });

  it("processes new events and stores them", async () => {
    req.body = { id: "evt_new", event: "invoice.payment_succeeded", data: { metadata: { tenantId: 1 } } };

    db.paystackEvent.findOne.mockResolvedValue(null);
    db.paystackEvent.create.mockResolvedValue({ id: 1 });

    await billingController.webhookHandler(req, res);

    expect(mockSyncFromPaymentGateway).toHaveBeenCalledWith(1, {
      event: "invoice.payment_succeeded",
      nextBillingDate: undefined,
      graceDays: 7,
    });
    expect(db.paystackEvent.create).toHaveBeenCalledWith({
      paystackEventId: "evt_new",
      tenantId: 1,
      event: "invoice.payment_succeeded",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  describe("charge.success — delivery creation", () => {
    const buildChargeSuccessBody = (overrides = {}) => ({
      id: "evt_charge_1",
      event: "charge.success",
      data: {
        amount: 12000,
        reference: "ref_abc",
        customer: { email: "wa_233241234567@rtrs.local" },
        metadata: {
          tenantId: 1,
          orderId: 100,
          customerPhone: "+233241234567",
          deliveryLocation: {
            latitude: 5.6037,
            longitude: -0.187,
            address: "Accra, Ghana",
            region: "Greater Accra",
          },
          discountAmount: 0,
        },
        ...overrides,
      },
    });

    const setupOrderMock = (overrides = {}) => {
      const order = {
        id: 100,
        total: "120.00",
        paymentStatus: "unpaid",
        customer: {
          id: 10,
          firstName: "WhatsApp",
          lastName: "Customer",
          phone: "+233241234567",
        },
        ...overrides,
      };
      orderDAO.getOrderById.mockResolvedValue(order);
      paymentDAO.create.mockResolvedValue({});
      paymentDAO.getOrderPayments.mockResolvedValue([{ amount: "120.00" }]);
      orderDAO.updateOrder.mockResolvedValue(order);
      db.paystackEvent.findOne.mockResolvedValue(null);
      db.paystackEvent.create.mockResolvedValue({});
      return order;
    };

    it("creates a delivery and sends tracking notification when payment is paid in full", async () => {
      req.body = buildChargeSuccessBody();
      setupOrderMock();

      await billingController.webhookHandler(req, res);

      expect(orderDAO.updateOrder).toHaveBeenCalledWith(
        100,
        1,
        { paymentStatus: "paid" }
      );
      expect(mockCreateFromWhatsApp).toHaveBeenCalledWith(
        1,
        100,
        req.body.data.metadata.deliveryLocation,
        "WhatsApp Customer",
        "+233241234567"
      );
      expect(mockRenderTemplate).toHaveBeenCalledWith(
        "delivery_tracking",
        { trackingNumber: "TRK123" },
        1
      );
      expect(mockSendWhatsAppText).toHaveBeenCalledWith(
        "+233241234567",
        expect.stringContaining("TRK123"),
        1
      );
    });

    it("does not create delivery when payment is partial", async () => {
      req.body = buildChargeSuccessBody({
        amount: 5000,
      });
      const order = setupOrderMock();
      order.total = "120.00";
      paymentDAO.getOrderPayments.mockResolvedValue([{ amount: "50.00" }]);

      await billingController.webhookHandler(req, res);

      expect(orderDAO.updateOrder).toHaveBeenCalledWith(
        100,
        1,
        { paymentStatus: "partial" }
      );
      expect(mockCreateFromWhatsApp).not.toHaveBeenCalled();
      expect(mockSendWhatsAppText).not.toHaveBeenCalled();
    });

    it("does not create delivery when metadata has no deliveryLocation", async () => {
      req.body = buildChargeSuccessBody({
        metadata: {
          tenantId: 1,
          orderId: 100,
          customerPhone: "+233241234567",
          discountAmount: 0,
        },
      });
      setupOrderMock();

      await billingController.webhookHandler(req, res);

      expect(orderDAO.updateOrder).toHaveBeenCalledWith(100, 1, { paymentStatus: "paid" });
      expect(mockCreateFromWhatsApp).not.toHaveBeenCalled();
      expect(mockSendWhatsAppText).not.toHaveBeenCalled();
    });

    it("still returns 200 when delivery creation throws", async () => {
      req.body = buildChargeSuccessBody();
      setupOrderMock();
      mockCreateFromWhatsApp.mockRejectedValue(new Error("ShaQ Express API down"));

      await billingController.webhookHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockSendWhatsAppText).not.toHaveBeenCalled();
    });

    it("still returns 200 when order is not found", async () => {
      req.body = buildChargeSuccessBody();
      db.paystackEvent.findOne.mockResolvedValue(null);
      db.paystackEvent.create.mockResolvedValue({});
      orderDAO.getOrderById.mockResolvedValue(null);

      await billingController.webhookHandler(req, res);

      expect(mockCreateFromWhatsApp).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("uses discountAmount when computing effective total", async () => {
      req.body = buildChargeSuccessBody({
        amount: 10000,
        metadata: {
          tenantId: 1,
          orderId: 100,
          customerPhone: "+233241234567",
          deliveryLocation: {
            latitude: 5.6037,
            longitude: -0.187,
            address: "Accra, Ghana",
          },
          discountAmount: 20,
        },
      });
      const order = setupOrderMock();
      order.total = "120.00";
      paymentDAO.getOrderPayments.mockResolvedValue([{ amount: "100.00" }]);

      await billingController.webhookHandler(req, res);

      expect(orderDAO.updateOrder).toHaveBeenCalledWith(100, 1, { paymentStatus: "paid" });
      expect(mockCreateFromWhatsApp).toHaveBeenCalled();
    });

    it("marks partial when discount makes paid < effective total", async () => {
      req.body = buildChargeSuccessBody({
        amount: 5000,
        metadata: {
          tenantId: 1,
          orderId: 100,
          customerPhone: "+233241234567",
          deliveryLocation: {
            latitude: 5.6037,
            longitude: -0.187,
            address: "Accra, Ghana",
          },
          discountAmount: 20,
        },
      });
      const order = setupOrderMock();
      order.total = "120.00";
      paymentDAO.getOrderPayments.mockResolvedValue([{ amount: "50.00" }]);

      await billingController.webhookHandler(req, res);

      expect(orderDAO.updateOrder).toHaveBeenCalledWith(100, 1, { paymentStatus: "partial" });
      expect(mockCreateFromWhatsApp).not.toHaveBeenCalled();
    });
  });
});
