"use strict";

jest.mock("../tenant-platform/DAOs/passSigningRequest.dao", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  listByTenant: jest.fn(),
  listPendingApproval: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  updatePaymentStatus: jest.fn(),
  updatePlatformStatus: jest.fn(),
  setSigning: jest.fn(),
  markCompletedIfAllDone: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/signedPassArtifact.dao", () => ({
  create: jest.fn(),
  listByRequest: jest.fn(),
  findByRequestAndPlatform: jest.fn(),
}));

jest.mock("../tenant-platform/services/paystack.service", () => ({
  initializeCharge: jest.fn(),
  buildSplitConfig: jest.fn().mockReturnValue(null),
  verifyPayment: jest.fn(),
  refundPayment: jest.fn(),
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  createPlan: jest.fn(),
  fetchCustomer: jest.fn(),
  buildPlatformClient: jest.fn(),
  validateSecretKey: jest.fn(),
  updatePlatformPaystackConfig: jest.fn(),
  verifyWebhookSignature: jest.fn().mockResolvedValue(true),
}));

jest.mock("../db/models", () => ({
  setting: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    upsert: jest.fn(),
  },
  sequelize: {
    query: jest.fn(),
    literal: jest.fn((str) => str),
  },
  Sequelize: { Op: { in: 5 }, literal: jest.fn((str) => str) },
  Event: { findOne: jest.fn(), findByPk: jest.fn() },
  tenant: { findByPk: jest.fn() },
  user: { findAll: jest.fn(), findByPk: jest.fn() },
}));

jest.mock("../queues/walletPass.queue", () => ({
  enqueueWalletPassSigning: jest.fn(),
}));

const walletPassRequestController = require("../verticals/event/controllers/walletPassRequest.controller");
const passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
const signedPassArtifactDAO = require("../tenant-platform/DAOs/signedPassArtifact.dao");
const { initializeCharge } = require("../tenant-platform/services/paystack.service");
const { enqueueWalletPassSigning } = require("../queues/walletPass.queue");
const db = require("../db/models");
const { createRes } = require("./utils/test-response");

function createReq(overrides = {}) {
  return {
    user: { id: 1, email: "tenant@example.com" },
    tenant: { id: 1 },
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

describe("walletPassRequest.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSigningRequest", () => {
    it("returns 403 when no tenant context", async () => {
      const req = { ...createReq(), tenant: undefined };
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 404 when event not found", async () => {
      db.Event.findOne.mockResolvedValue(null);
      const req = createReq({ params: { eventId: "1" } });
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);
      expect(db.Event.findOne).toHaveBeenCalledWith({ where: { id: "1", tenantId: 1 } });
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 when design not configured", async () => {
      db.Event.findOne.mockResolvedValue({ id: 1, name: "Test Event", venue: "Venue", eventDate: "2025-01-01" });
      db.setting.findOne.mockResolvedValue(null);
      const req = createReq({ params: { eventId: "1" } });
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 503 when price not configured", async () => {
      db.Event.findOne.mockResolvedValue({ id: 1, name: "Test Event", venue: "Venue", eventDate: "2025-01-01" });
      db.setting.findOne
        .mockResolvedValueOnce({ value: { backgroundColor: "#007AFF" } })
        .mockResolvedValueOnce({ value: 0 })
        .mockResolvedValueOnce({ value: "GHS" });
      const req = createReq({ params: { eventId: "1" } });
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("creates request and returns payment URL on success", async () => {
      db.Event.findOne.mockResolvedValue({ id: 1, name: "Test Event", venue: "Venue", eventDate: "2025-01-01" });
      const mockRequest = { id: 1, update: jest.fn().mockResolvedValue({}) };

      db.setting.findOne
        .mockResolvedValueOnce({ value: { backgroundColor: "#007AFF" } })
        .mockResolvedValueOnce({ value: 50.0 })
        .mockResolvedValueOnce({ value: "GHS" });

      passSigningRequestDAO.create.mockResolvedValue(mockRequest);
      initializeCharge.mockResolvedValue({
        reference: "paystack-ref-123",
        authorization_url: "https://paystack.com/pay/abc123",
      });

      const req = createReq({ params: { eventId: "1" } });
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);

      expect(passSigningRequestDAO.create).toHaveBeenCalledWith({
        tenantId: 1,
        eventId: 1,
        requesterId: 1,
        designSnapshot: expect.any(Object),
        amount: 50.0,
        currency: "GHS",
      });
      expect(initializeCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "tenant@example.com",
          amount: 50.0,
          currency: "GHS",
        })
      );
      expect(mockRequest.update).toHaveBeenCalledWith({ paymentReference: "paystack-ref-123" });
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it("returns 502 when Paystack charge fails", async () => {
      db.Event.findOne.mockResolvedValue({ id: 1, name: "Test Event", venue: "Venue", eventDate: "2025-01-01" });
      db.setting.findOne
        .mockResolvedValueOnce({ value: { backgroundColor: "#007AFF" } })
        .mockResolvedValueOnce({ value: 50.0 })
        .mockResolvedValueOnce({ value: "GHS" });

      const mockRequest = { id: 1, update: jest.fn().mockResolvedValue({}) };
      passSigningRequestDAO.create.mockResolvedValue(mockRequest);
      initializeCharge.mockRejectedValue(new Error("Paystack API error"));

      const req = createReq({ params: { eventId: "1" } });
      const res = createRes();
      await walletPassRequestController.createSigningRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(502);
    });
  });

  describe("listRequests", () => {
    it("returns requests for tenant", async () => {
      const mockRequests = [
        { id: 1, status: "pending", amount: 50.0, currency: "GHS", paymentReference: "ref1", platformStatuses: null, createdAt: new Date(), updatedAt: new Date(), completedAt: null, eventId: 1 },
      ];
      passSigningRequestDAO.listByTenant.mockResolvedValue(mockRequests);

      const req = createReq({ query: {} });
      const res = createRes();
      await walletPassRequestController.listRequests(req, res);
      expect(passSigningRequestDAO.listByTenant).toHaveBeenCalledWith(1, { status: undefined, limit: 50 });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
        })
      );
    });
  });

  describe("getRequest", () => {
    it("returns 404 when request not found", async () => {
      passSigningRequestDAO.findById.mockResolvedValue(null);
      signedPassArtifactDAO.listByRequest.mockResolvedValue([]);

      const req = createReq({ params: { requestId: "999" } });
      const res = createRes();
      await walletPassRequestController.getRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns request with artifacts", async () => {
      const mockRequest = {
        id: 1, eventId: 1, status: "pending", amount: 50.0, currency: "GHS",
        paymentReference: "ref", platformStatuses: { apple: "pending" }, reviewNotes: null,
        designSnapshot: {}, createdAt: new Date(), updatedAt: new Date(), completedAt: null,
      };
      passSigningRequestDAO.findById.mockResolvedValue(mockRequest);
      signedPassArtifactDAO.listByRequest.mockResolvedValue([
        { id: 1, platform: "apple", status: "pending", artifactType: "file", artifactPath: null, error: null },
      ]);

      const req = createReq({ params: { requestId: "1" } });
      const res = createRes();
      await walletPassRequestController.getRequest(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          artifacts: expect.arrayContaining([
            expect.objectContaining({ platform: "apple", status: "pending" }),
          ]),
        })
      );
    });
  });

  describe("listPendingApproval", () => {
    it("returns pending requests for super-admin", async () => {
      const mockRequests = [
        {
          id: 1, tenantId: 1, eventId: 1, status: "pending", amount: 50.0,
          currency: "GHS", paymentReference: "ref", requester: { id: 2, username: "tenant", email: "t@e.com" },
          createdAt: new Date(),
        },
      ];
      passSigningRequestDAO.listPendingApproval.mockResolvedValue(mockRequests);

      const req = createReq({ query: {} });
      const res = createRes();
      await walletPassRequestController.listPendingApproval(req, res);
      expect(passSigningRequestDAO.listPendingApproval).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
        })
      );
    });
  });

  describe("approveRequest", () => {
    it("returns 404 when request not found", async () => {
      passSigningRequestDAO.findById.mockResolvedValue(null);
      const req = createReq({ params: { requestId: "999" }, body: {} });
      const res = createRes();
      await walletPassRequestController.approveRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 409 when request is not in pending status", async () => {
      passSigningRequestDAO.findById.mockResolvedValue({ status: "completed" });
      const req = createReq({ params: { requestId: "1" }, body: {} });
      const res = createRes();
      await walletPassRequestController.approveRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("approves and enqueues signing job", async () => {
      const mockRequest = {
        id: 1, status: "pending", tenantId: 1, paymentReference: "ref",
        platformStatuses: { apple: "pending" }, reviewNotes: null,
        designSnapshot: {}, eventId: 1, requesterId: 2, reviewerId: null,
        amount: 50.0, currency: "GHS", createdAt: new Date(), updatedAt: new Date(), completedAt: null,
      };
      passSigningRequestDAO.findById.mockResolvedValue(mockRequest);
      const approvedResult = { id: 1, status: "approved", tenantId: 1, designSnapshot: {} };
      passSigningRequestDAO.approve.mockReset();
      passSigningRequestDAO.approve.mockResolvedValueOnce(approvedResult);
      enqueueWalletPassSigning.mockReset();
      enqueueWalletPassSigning.mockResolvedValueOnce({ enqueued: true, jobId: "job-123" });

      const req = createReq({ params: { requestId: "1" }, body: {} });
      const res = createRes();
      await walletPassRequestController.approveRequest(req, res);
      expect(passSigningRequestDAO.approve).toHaveBeenCalledWith("1", 1, null);
      expect(enqueueWalletPassSigning).toHaveBeenCalledWith(1, 1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "approved",
          enqueued: true,
          jobId: "job-123",
        })
      );
    });

    it("approves but reports job not enqueued when Redis unavailable", async () => {
      const mockRequest = {
        id: 1, status: "pending", tenantId: 1,
        designSnapshot: {}, eventId: 1,
      };
      passSigningRequestDAO.findById.mockResolvedValue(mockRequest);
      passSigningRequestDAO.approve.mockResolvedValue({ ...mockRequest, status: "approved" });
      enqueueWalletPassSigning.mockResolvedValue({ enqueued: false });

      const req = createReq({ params: { requestId: "1" }, body: {} });
      const res = createRes();
      await walletPassRequestController.approveRequest(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          enqueued: false,
        })
      );
    });
  });

  describe("rejectRequest", () => {
    it("returns 404 when request not found", async () => {
      passSigningRequestDAO.findById.mockResolvedValue(null);
      const req = createReq({ params: { requestId: "999" }, body: { notes: "Bad design" } });
      const res = createRes();
      await walletPassRequestController.rejectRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 409 when request is not pending", async () => {
      passSigningRequestDAO.findById.mockResolvedValue({ status: "approved" });
      const req = createReq({ params: { requestId: "1" }, body: { notes: "Bad design" } });
      const res = createRes();
      await walletPassRequestController.rejectRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("returns 400 when rejection notes missing", async () => {
      passSigningRequestDAO.findById.mockResolvedValue({ status: "pending" });
      const req = createReq({ params: { requestId: "1" }, body: {} });
      const res = createRes();
      await walletPassRequestController.rejectRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("rejects with notes", async () => {
      passSigningRequestDAO.findById.mockResolvedValue({ status: "pending" });
      passSigningRequestDAO.reject.mockResolvedValue({ status: "rejected", id: 1 });

      const req = createReq({ params: { requestId: "1" }, body: { notes: "Bad design" } });
      const res = createRes();
      await walletPassRequestController.rejectRequest(req, res);
      expect(passSigningRequestDAO.reject).toHaveBeenCalledWith("1", 1, "Bad design");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: "rejected",
        })
      );
    });
  });
});
