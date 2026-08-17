// codacy-suppress Cryptography,Hardcoded_Secrets - test-only fixtures for unit tests
const { verifyWebhookSignature, createPlan, initializeCharge, refundPayment, buildSplitConfig } = require("../tenant-platform/services/paystack.service");

jest.mock("../db/models");

describe("paystack.service currency formatting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("createPlan converts GHS amount to pesewas and sets currency", async () => {
    const mockClient = { post: jest.fn().mockResolvedValue({ data: { data: { id: "plan_123" } } }) };
    jest.doMock("axios", () => ({ create: jest.fn(() => mockClient) }));

    const db = require("../db/models");
    db.setting = { findOne: jest.fn().mockResolvedValue({ value: { secretKey: "sk_test", webhookSecret: "ws", mode: "test" } }) };

    const { createPlan } = require("../tenant-platform/services/paystack.service");
    await createPlan({ name: "Monthly", amount: 50, interval: "monthly", currency: "GHS" });

    expect(mockClient.post).toHaveBeenCalledWith("/plan", {
      name: "Monthly",
      amount: 5000,
      interval: "monthly",
      currency: "GHS",
    });
  });

  it("initializeCharge converts amount to pesewas", async () => {
    const mockClient = { post: jest.fn().mockResolvedValue({ data: { data: { ref: "ref_1" } } }) };
    jest.doMock("axios", () => ({ create: jest.fn(() => mockClient) }));

    const db = require("../db/models");
    db.setting = { findOne: jest.fn().mockResolvedValue({ value: { secretKey: "sk_test", webhookSecret: "ws", mode: "test" } }) };

    const { initializeCharge } = require("../tenant-platform/services/paystack.service");
    await initializeCharge({ email: "u@t.com", amount: 25.50 });

    expect(mockClient.post).toHaveBeenCalledWith("/transaction/initialize", {
      email: "u@t.com",
      amount: 2550,
      metadata: {},
    });
  });

  it("refundPayment converts amount to pesewas", async () => {
    const mockClient = { post: jest.fn().mockResolvedValue({ data: { data: { status: "success" } } }) };
    jest.doMock("axios", () => ({ create: jest.fn(() => mockClient) }));

    const db = require("../db/models");
    db.setting = { findOne: jest.fn().mockResolvedValue({ value: { secretKey: "sk_test", webhookSecret: "ws", mode: "test" } }) };

    const { refundPayment } = require("../tenant-platform/services/paystack.service");
    await refundPayment("ref_123", 10);

    expect(mockClient.post).toHaveBeenCalledWith("/refund", {
      transaction: "ref_123",
      amount: 1000,
    });
  });

  it("buildSplitConfig returns null when tenant has no subaccount code", () => {
    const result = buildSplitConfig(null);
    expect(result).toBeNull();
  });

  it("buildSplitConfig returns config object when tenant has subaccount code", () => {
    const tenant = { paystackSubaccountCode: "ACCT_abc", settings: { splitBearer: "account", splitCharge: 5000 } };
    const result = buildSplitConfig(tenant);
    expect(result).toEqual({
      subaccountCode: "ACCT_abc",
      bearer: "account",
      transactionCharge: 5000,
    });
  });

  it("verifyWebhookSignature returns true for matching HMAC-SHA512", async () => {
    const crypto = require("crypto");
    const payload = JSON.stringify({ event: "charge.success" });
    const secret = "ws_secret";
    const signature = crypto.createHmac("sha512", secret).update(payload).digest("hex");

    jest.doMock("../db/models", () => ({
      setting: { findOne: jest.fn().mockResolvedValue({ value: { webhookSecret: "ws_secret" } }) },
    }));

    const { verifyWebhookSignature } = require("../tenant-platform/services/paystack.service");
    const result = await verifyWebhookSignature(Buffer.from(payload), signature);
    expect(result).toBe(true);
  });
});
