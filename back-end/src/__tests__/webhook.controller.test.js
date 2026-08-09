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
  appointment: {
    findOne: jest.fn(),
  },
}));

const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
const failedPaymentAlertDAO = require("../tenant-platform/DAOs/failedPaymentAlert.dao");
const db = require("../db/models");
const { createRes } = require("./utils/test-response");

function createReq(body, headers = {}) {
  return {
    body,
    headers,
    tenant: { id: 1 },
    ip: "127.0.0.1",
  };
}

describe("webhook.controller paystackEventHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.appointment.findOne.mockResolvedValue({ id: 1, paymentStatus: "unpaid", update: jest.fn().mockResolvedValue(true) });
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

  it("updates appointment paymentStatus on charge.success with appointmentId in metadata", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const mockUpdate = jest.fn().mockResolvedValue(true);
    db.appointment.findOne.mockResolvedValue({ id: 1, paymentStatus: "unpaid", update: mockUpdate });

    const req = createReq(
      {
        event: "charge.success",
        data: {
          metadata: { appointmentId: 1, tenantId: "1" },
          amount: "5000",
        },
      },
      { "x-paystack-signature": "valid-sig" }
    );
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(db.appointment.findOne).toHaveBeenCalledWith({ where: { id: 1, tenantId: 1 } });
    expect(mockUpdate).toHaveBeenCalledWith({
      paymentStatus: "paid",
      depositAmount: 50,
    });
  });

  it("ignores charge.success when appointment is already paid", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const mockUpdate = jest.fn().mockResolvedValue(true);
    db.appointment.findOne.mockResolvedValue({ id: 1, paymentStatus: "paid", update: mockUpdate });

    const req = createReq(
      {
        event: "charge.success",
        data: {
          metadata: { appointmentId: 1, tenantId: "1" },
          amount: "5000",
        },
      },
      { "x-paystack-signature": "valid-sig" }
    );
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("ignores charge.success when appointmentId is missing", async () => {
    verifyWebhookSignature.mockResolvedValue(true);
    const req = createReq(
      {
        event: "charge.success",
        data: {
          metadata: {},
          amount: "5000",
        },
      },
      { "x-paystack-signature": "valid-sig" }
    );
    const res = createRes();

    await paystackEventHandler(req, res);

    expect(db.appointment.findOne).not.toHaveBeenCalled();
  });
});
