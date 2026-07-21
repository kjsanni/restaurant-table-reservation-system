const dsarRequestDAO = require("../tenant-platform/DAOs/dsarRequest.dao");

jest.mock("../tenant-platform/DAOs/dsarRequest.dao", () => ({
  listByTenant: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
}));

const dsarRequestController = require("../tenant-platform/controllers/dsarRequest.controller");

describe("dsarRequest.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { params: { tenantId: "1" }, body: {}, ip: "127.0.0.1", headers: {}, user: { id: 5 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("listHandler", () => {
    it("should return 200 with dsar requests", async () => {
      dsarRequestDAO.listByTenant.mockResolvedValue([
        { id: 1, requestType: "access", status: "pending", createdAt: "2026-07-21T00:00:00Z", updatedAt: "2026-07-21T00:00:00Z" },
      ]);
      await dsarRequestController.listHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        items: [
          {
            id: 1,
            requestType: "access",
            status: "pending",
            requestData: undefined,
            staffNotes: undefined,
            fulfilledAt: undefined,
            createdAt: "2026-07-21T00:00:00Z",
            updatedAt: "2026-07-21T00:00:00Z",
            requester: undefined,
            ipAddress: undefined,
          },
        ],
      });
      expect(dsarRequestDAO.listByTenant).toHaveBeenCalledWith("1");
    });
  });

  describe("getHandler", () => {
    it("should return 200 with a single request", async () => {
      dsarRequestDAO.findById.mockResolvedValue({
        id: 1, requestType: "erasure", status: "processing", createdAt: "2026-07-21T00:00:00Z", updatedAt: "2026-07-21T00:00:00Z",
      });
      req.params.id = "1";
      await dsarRequestController.getHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        item: {
          id: 1,
          requestType: "erasure",
          status: "processing",
          requestData: undefined,
          staffNotes: undefined,
          fulfilledAt: undefined,
          createdAt: "2026-07-21T00:00:00Z",
          updatedAt: "2026-07-21T00:00:00Z",
        },
      });
    });

    it("should return 404 when not found", async () => {
      dsarRequestDAO.findById.mockResolvedValue(null);
      req.params.id = "999";
      await dsarRequestController.getHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "DSAR request not found" });
    });
  });

  describe("createHandler", () => {
    it("should return 201 on valid creation", async () => {
      dsarRequestDAO.create.mockResolvedValue({
        id: 2, requestType: "access", status: "pending", createdAt: "2026-07-21T00:00:00Z", updatedAt: "2026-07-21T00:00:00Z",
      });
      req.body = { requestType: "access", requestData: { email: "guest@example.com" } };
      await dsarRequestController.createHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        item: {
          id: 2,
          requestType: "access",
          status: "pending",
          requestData: undefined,
          staffNotes: undefined,
          fulfilledAt: undefined,
          createdAt: "2026-07-21T00:00:00Z",
          updatedAt: "2026-07-21T00:00:00Z",
        },
      });
      expect(dsarRequestDAO.create).toHaveBeenCalledWith({
        tenantId: "1",
        userId: 5,
        requestType: "access",
        requestData: { email: "guest@example.com" },
        ipAddress: "127.0.0.1",
        userAgent: null,
      });
    });

    it("should return 400 for invalid requestType", async () => {
      req.body = { requestType: "invalid_type" };
      await dsarRequestController.createHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining("Invalid requestType") });
    });

    it("should return 400 when requestType is missing", async () => {
      req.body = {};
      await dsarRequestController.createHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("patchHandler", () => {
    it("should update status and notes", async () => {
      dsarRequestDAO.findById.mockResolvedValueOnce({
        id: 1, requestType: "access", status: "pending", staffNotes: null, fulfilledAt: null,
      });
      dsarRequestDAO.updateStatus.mockResolvedValue([1]);
      dsarRequestDAO.findById.mockResolvedValueOnce({
        id: 1, requestType: "access", status: "processing", staffNotes: "Reviewed", fulfilledAt: null, createdAt: "2026-07-21T00:00:00Z", updatedAt: "2026-07-21T00:00:00Z",
      });
      req.params.id = "1";
      req.body = { status: "processing", staffNotes: "Reviewed" };
      await dsarRequestController.patchHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(dsarRequestDAO.updateStatus).toHaveBeenCalledWith("1", "1", "processing", "Reviewed", null);
    });

    it("should return 404 when request not found", async () => {
      dsarRequestDAO.findById.mockResolvedValue(null);
      req.params.id = "999";
      req.body = { status: "fulfilled" };
      await dsarRequestController.patchHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 for invalid status", async () => {
      dsarRequestDAO.findById.mockResolvedValue({ id: 1, status: "pending", staffNotes: null, fulfilledAt: null });
      req.params.id = "1";
      req.body = { status: "invalid_status" };
      await dsarRequestController.patchHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining("Invalid status") });
    });

    it("should auto-set fulfilledAt when moving to fulfilled", async () => {
      const now = new Date();
      dsarRequestDAO.findById.mockResolvedValueOnce({
        id: 1, requestType: "access", status: "processing", staffNotes: "Done", fulfilledAt: null,
      });
      dsarRequestDAO.updateStatus.mockResolvedValue([1]);
      dsarRequestDAO.findById.mockResolvedValueOnce({
        id: 1, requestType: "access", status: "fulfilled", staffNotes: "Done", fulfilledAt: now, createdAt: "2026-07-21T00:00:00Z", updatedAt: "2026-07-21T00:00:00Z",
      });
      req.params.id = "1";
      req.body = { status: "fulfilled" };
      await dsarRequestController.patchHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(dsarRequestDAO.updateStatus).toHaveBeenCalledWith("1", "1", "fulfilled", "Done", expect.any(Date));
    });
  });
});
