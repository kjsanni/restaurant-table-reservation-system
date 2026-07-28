const { paystackEventHandler } = require("../controllers/webhook.controller");

jest.mock("../tenant-platform/DAOs/failedPaymentAlert.dao", () => ({
  create: jest.fn().mockResolvedValue({ id: 1 }),
}));

jest.mock("../tenant-platform/services/paystack.service", () => ({
  verifyWebhookSignature: jest.fn(),
}));

jest.mock("../db/models", () => ({
  tenant: {
    findByPk: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
const failedPaymentAlertDAO = require("../tenant-platform/DAOs/failedPaymentAlert.dao");
const db = require("../db/models");

function createReq(body, headers = {}) {
  return {
    body,
    headers,
    tenant: { id: 1 },
    ip: "127.0.0.1",
  };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("webhook.controller paystackEventHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects request with invalid signature", async () => {
    verifyWebhookSignature.mockResolvedValue(false);
    const req = createReq({ event: "charge.failed", data: {} });
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid signature",
    });
    expect(failedPaymentAlertDAO.create).not.toHaveBeenCalled();
  });

  it("accepts request with valid signature and processes charge.failed", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const req = createReq(
      {
        event: "charge.failed",
        data: {
          metadata: { tenantId: "1", reservationId: "5" },
          reference: "ref-123",
          amount: "5000",
          currency: "GHS",
          gateway_response: "insufficient funds",
          customer: { email: "user@example.com" },
          authorization: "auth-123",
          ip_address: "10.0.0.1",
        },
      },
      { "x-paystack-signature": "valid-sig" }
    );
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
    expect(failedPaymentAlertDAO.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 1,
        reservationId: "5",
        reference: "ref-123",
        reason: "insufficient funds",
      })
    );
  });

  it("ignores non-charge.failed events even with valid signature", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const req = createReq({ event: "invoice.payment_succeeded", data: {} });
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(failedPaymentAlertDAO.create).not.toHaveBeenCalled();
  });
});
