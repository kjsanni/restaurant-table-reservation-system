const breakGlassController = require("../tenant-platform/controllers/breakGlass.controller");

jest.mock("../tenant-platform/DAOs/breakGlassRequest.dao", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  listPending: jest.fn(),
  listForUser: jest.fn(),
  approve: jest.fn(),
  deny: jest.fn(),
  revoke: jest.fn(),
  expireOld: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(() => Promise.resolve()),
}));

const breakGlassRequestDAO = require("../tenant-platform/DAOs/breakGlassRequest.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, overrides = {}) {
  return {
    user,
    tenant: { id: 1 },
    ip: "127.0.0.1",
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

describe("breakGlass.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requestBreakGlassHandler", () => {
    it("returns 400 when justification is missing", async () => {
      const req = createReq();
      const res = createRes();
      await breakGlassController.requestBreakGlassHandler({ ...req, body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when justification is too short", async () => {
      const req = createReq();
      const res = createRes();
      await breakGlassController.requestBreakGlassHandler({ ...req, body: { justification: "short" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when duration is invalid", async () => {
      const req = createReq();
      const res = createRes();
      await breakGlassController.requestBreakGlassHandler(
        { ...req, body: { justification: "Need access for emergency", durationMinutes: 999 } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates request and logs audit", async () => {
      const mockRequest = { id: 1, userId: 1, status: "pending", durationMinutes: 60 };
      breakGlassRequestDAO.create.mockResolvedValue(mockRequest);
      const req = createReq();
      const res = createRes();
      await breakGlassController.requestBreakGlassHandler(
        { ...req, body: { justification: "Need access for emergency maintenance", durationMinutes: 60 } },
        res
      );
      expect(breakGlassRequestDAO.create).toHaveBeenCalledWith(1, "Need access for emergency maintenance", 60);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "break_glass.requested",
        "break_glass",
        1,
        1,
        { durationMinutes: 60, justification: "Need access for emergency maintenance" },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("approveBreakGlassHandler", () => {
    it("returns 404 when request not found", async () => {
      breakGlassRequestDAO.approve.mockResolvedValue(null);
      const req = createReq();
      const res = createRes();
      await breakGlassController.approveBreakGlassHandler({ ...req, params: { requestId: "999" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("approves request and logs audit", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        status: "approved",
        elevatedUntil: new Date(Date.now() + 60 * 60 * 1000),
        notes: "Approved",
      };
      breakGlassRequestDAO.approve.mockResolvedValue(mockRequest);
      const req = createReq();
      const res = createRes();
      await breakGlassController.approveBreakGlassHandler(
        { ...req, params: { requestId: "1" }, body: { notes: "Approved" } },
        res
      );
      expect(breakGlassRequestDAO.approve).toHaveBeenCalledWith("1", 1, "Approved");
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "break_glass.approved",
        "break_glass",
        1,
        1,
        { elevatedUntil: mockRequest.elevatedUntil, notes: "Approved" },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("denyBreakGlassHandler", () => {
    it("returns 404 when request not found", async () => {
      breakGlassRequestDAO.deny.mockResolvedValue(null);
      const req = createReq();
      const res = createRes();
      await breakGlassController.denyBreakGlassHandler({ ...req, params: { requestId: "999" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("denies request and logs audit", async () => {
      const mockRequest = { id: 1, status: "denied", notes: "Denied" };
      breakGlassRequestDAO.deny.mockResolvedValue(mockRequest);
      const req = createReq();
      const res = createRes();
      await breakGlassController.denyBreakGlassHandler(
        { ...req, params: { requestId: "1" }, body: { notes: "Denied" } },
        res
      );
      expect(breakGlassRequestDAO.deny).toHaveBeenCalledWith("1", 1, "Denied");
      expect(platformAuditDAO.log).toHaveBeenCalledWith(1, "break_glass.denied", "break_glass", 1, 1, { notes: "Denied" }, "127.0.0.1");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("revokeBreakGlassHandler", () => {
    it("returns 404 when request not found", async () => {
      breakGlassRequestDAO.revoke.mockResolvedValue(null);
      const req = createReq();
      const res = createRes();
      await breakGlassController.revokeBreakGlassHandler({ ...req, params: { requestId: "999" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("revokes request and logs audit", async () => {
      const mockRequest = { id: 1, status: "revoked" };
      breakGlassRequestDAO.revoke.mockResolvedValue(mockRequest);
      const req = createReq();
      const res = createRes();
      await breakGlassController.revokeBreakGlassHandler({ ...req, params: { requestId: "1" } }, res);
      expect(breakGlassRequestDAO.revoke).toHaveBeenCalledWith("1", 1);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(1, "break_glass.revoked", "break_glass", 1, 1, {}, "127.0.0.1");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("listBreakGlassRequestsHandler", () => {
    it("returns list of pending requests", async () => {
      const mockRequests = [{ id: 1, status: "pending" }];
      breakGlassRequestDAO.listPending.mockResolvedValue(mockRequests);
      const req = createReq();
      const res = createRes();
      await breakGlassController.listBreakGlassRequestsHandler({ ...req, query: {} }, res);
      expect(breakGlassRequestDAO.listPending).toHaveBeenCalledWith({ status: undefined, limit: 100 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, collection: mockRequests });
    });
  });

  describe("listMyBreakGlassRequestsHandler", () => {
    it("returns list of user requests", async () => {
      const mockRequests = [{ id: 1, userId: 1, status: "pending" }];
      breakGlassRequestDAO.listForUser.mockResolvedValue(mockRequests);
      const req = createReq();
      const res = createRes();
      await breakGlassController.listMyBreakGlassRequestsHandler({ ...req, query: {} }, res);
      expect(breakGlassRequestDAO.listForUser).toHaveBeenCalledWith(1, { status: undefined, limit: 100 });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("expireBreakGlassHandler", () => {
    it("expires old requests", async () => {
      breakGlassRequestDAO.expireOld.mockResolvedValue([]);
      const req = createReq();
      const res = createRes();
      await breakGlassController.expireBreakGlassHandler(req, res);
      expect(breakGlassRequestDAO.expireOld).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, expiredCount: 0 });
    });
  });
});
