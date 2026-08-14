"use strict";

jest.mock("../db/models", () => ({
  passSigningRequest: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  },
  user: {},
  Event: {},
  signedPassArtifact: {},
  Sequelize: { Op: { in: 5, lt: 10, eq: 3 } },
}));

const passSigningRequestDAO = require("../tenant-platform/DAOs/passSigningRequest.dao");
const db = require("../db/models");

describe("passSigningRequest.dao", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("creates a request with pending_payment status and default platform statuses", async () => {
      const mockRequest = { id: 1, status: "pending_payment" };
      db.passSigningRequest.create.mockResolvedValue(mockRequest);

      const result = await passSigningRequestDAO.create({
        tenantId: 1,
        eventId: 5,
        requesterId: 10,
        designSnapshot: { design: { backgroundColor: "#007AFF" } },
        amount: 50.0,
        currency: "GHS",
      });

      expect(db.passSigningRequest.create).toHaveBeenCalledWith({
  tenantId: 1,
  eventId: 5,
  requesterId: 10,
  designSnapshot: { design: { backgroundColor: "#007AFF" } },
  amount: 50.0,
  currency: "GHS",
  status: "pending_payment",
  platformStatuses: { apple: "pending", google: "pending", samsung: "pending" },
      });
      expect(result).toEqual(mockRequest);
    });
  });

  describe("findById", () => {
    it("finds by id only when tenantId is null", async () => {
      db.passSigningRequest.findOne.mockResolvedValue({ id: 1 });
      await passSigningRequestDAO.findById(1);
      expect(db.passSigningRequest.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Array),
      });
    });

    it("scopes by tenantId when provided", async () => {
      db.passSigningRequest.findOne.mockResolvedValue({ id: 1, tenantId: 1 });
      await passSigningRequestDAO.findById(1, 1);
      expect(db.passSigningRequest.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 1 },
        include: expect.any(Array),
      });
    });
  });

  describe("listByTenant", () => {
    it("returns requests filtered by status when provided", async () => {
      db.passSigningRequest.findAll.mockResolvedValue([{ id: 1 }]);
      await passSigningRequestDAO.listByTenant(1, { status: "pending", limit: 50 });
      expect(db.passSigningRequest.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, status: "pending" },
          order: [["createdAt", "DESC"]],
          limit: 50,
        })
      );
    });

    it("returns all requests when status not provided", async () => {
      db.passSigningRequest.findAll.mockResolvedValue([{ id: 1 }]);
      await passSigningRequestDAO.listByTenant(1, {});
      expect(db.passSigningRequest.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
        })
      );
    });
  });

  describe("listPendingApproval", () => {
    it("returns pending requests", async () => {
      db.passSigningRequest.findAll.mockResolvedValue([{ id: 1, status: "pending" }]);
      await passSigningRequestDAO.listPendingApproval({});
      expect(db.passSigningRequest.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "pending" },
        })
      );
    });

    it("filters by tenantId when provided", async () => {
      db.passSigningRequest.findAll.mockResolvedValue([]);
      await passSigningRequestDAO.listPendingApproval({ tenantId: 5, limit: 20 });
      expect(db.passSigningRequest.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "pending", tenantId: 5 },
          limit: 20,
        })
      );
    });
  });

  describe("updatePaymentStatus", () => {
    it("updates status from pending_payment to pending when reference is provided", async () => {
      const mockRequest = {
        update: jest.fn().mockResolvedValue({ status: "pending" }),
        status: "pending_payment",
      };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.updatePaymentStatus(1, "ref-123");
      expect(mockRequest.update).toHaveBeenCalledWith({ paymentReference: "ref-123", status: "pending" });
    });

    it("does not update when status is not pending_payment", async () => {
      const mockRequest = { update: jest.fn(), status: "approved" };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.updatePaymentStatus(1, "ref-123");
      expect(mockRequest.update).not.toHaveBeenCalled();
    });

    it("returns null when request not found", async () => {
      db.passSigningRequest.findByPk.mockResolvedValue(null);
      const result = await passSigningRequestDAO.updatePaymentStatus(1, "ref");
      expect(result).toBeNull();
    });
  });

  describe("approve", () => {
    it("approves a pending request", async () => {
      const mockRequest = {
        update: jest.fn().mockImplementation(function (updates) {
          Object.assign(this, updates);
          return Promise.resolve(this);
        }),
        id: 1,
        status: "pending",
      };
      db.passSigningRequest.findOne.mockResolvedValue(mockRequest);
      const result = await passSigningRequestDAO.approve(1, 2, "approved by admin");
      expect(mockRequest.update).toHaveBeenCalledWith({ status: "approved", reviewerId: 2, reviewNotes: "approved by admin" });
      expect(result.status).toBe("approved");
    });

    it("returns null when request is not pending", async () => {
      const mockRequest = { id: 1, status: "approved" };
      db.passSigningRequest.findOne.mockResolvedValue(mockRequest);
      const result = await passSigningRequestDAO.approve(1, 2);
      expect(result).toBeNull();
    });
  });

  describe("reject", () => {
    it("rejects a pending request with notes", async () => {
      const mockRequest = { update: jest.fn().mockResolvedValue({}), id: 1, status: "pending" };
      db.passSigningRequest.findOne.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.reject(1, 2, "Bad design");
      expect(mockRequest.update).toHaveBeenCalledWith({ status: "rejected", reviewerId: 2, reviewNotes: "Bad design" });
    });

    it("returns null when request is not pending", async () => {
      const mockRequest = { id: 1, status: "approved" };
      db.passSigningRequest.findOne.mockResolvedValue(mockRequest);
      const result = await passSigningRequestDAO.reject(1, 2, "bad");
      expect(result).toBeNull();
    });
  });

  describe("updatePlatformStatus", () => {
    it("updates the platformStatuses JSON for a specific platform", async () => {
      const mockRequest = {
        update: jest.fn().mockResolvedValue({}),
        platformStatuses: { apple: "pending" },
      };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.updatePlatformStatus(1, "apple", "signed");
      expect(mockRequest.update).toHaveBeenCalledWith({ platformStatuses: { apple: "signed" } });
    });
  });

  describe("markCompletedIfAllDone", () => {
    it("marks as completed when all platforms are signed", async () => {
      const mockRequest = {
        update: jest.fn().mockResolvedValue({}),
        platformStatuses: { apple: "signed", google: "signed", samsung: "signed" },
      };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.markCompletedIfAllDone(1);
      expect(mockRequest.update).toHaveBeenCalledWith({ status: "completed", completedAt: expect.any(Date) });
    });

    it("marks as failed when at least one platform failed and all reached terminal", async () => {
      const mockRequest = {
        update: jest.fn().mockResolvedValue({}),
        platformStatuses: { apple: "failed", google: "signed", samsung: "signed" },
      };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.markCompletedIfAllDone(1);
      expect(mockRequest.update).toHaveBeenCalledWith({ status: "failed", completedAt: expect.any(Date) });
    });

    it("does nothing when not all platforms reached terminal state", async () => {
      const mockRequest = {
        update: jest.fn().mockResolvedValue({}),
        platformStatuses: { apple: "pending", google: "signed", samsung: "signed" },
      };
      db.passSigningRequest.findByPk.mockResolvedValue(mockRequest);
      await passSigningRequestDAO.markCompletedIfAllDone(1);
      expect(mockRequest.update).not.toHaveBeenCalled();
    });
  });
});
