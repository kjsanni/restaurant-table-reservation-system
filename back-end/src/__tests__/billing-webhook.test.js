describe("billingController.webhookHandler", () => {
  let req;
  let res;
  let mockVerifyWebhookSignature;
  let mockSyncFromPaymentGateway;
  let billingController;
  let db;

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

    jest.doMock("../tenant-platform/services/paystack.service", () => ({
      verifyWebhookSignature: mockVerifyWebhookSignature,
    }));

    jest.doMock("../tenant-platform/services/tenantSubscription.service", () => ({
      syncFromPaymentGateway: mockSyncFromPaymentGateway,
    }));

    db = require("../db/models");
    db.paystackEvent = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    db.tenant = {
      findOne: jest.fn().mockResolvedValue(null),
      findByPk: jest.fn().mockResolvedValue({ id: 1 }),
    };

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
});
