const db = require("../db/models");
const dsarRequestDAO = require("../tenant-platform/DAOs/dsarRequest.dao");

jest.mock("../db/models", () => ({
  tenant: { findOne: jest.fn() },
}));

jest.mock("../tenant-platform/DAOs/dsarRequest.dao", () => ({
  create: jest.fn(),
}));

const publicDsarController = require("../tenant-platform/controllers/publicDsar.controller");

describe("publicDsar.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, ip: "127.0.0.1", headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should return 201 on valid guest submission", async () => {
    db.tenant.findOne.mockResolvedValue({ id: 7, slug: "bistro" });
    dsarRequestDAO.create.mockResolvedValue({
      id: 10, requestType: "access", status: "pending", createdAt: "2026-07-21T00:00:00Z",
    });
    req.body = {
      tenantSlug: "bistro",
      requestType: "access",
      requestData: { email: "guest@example.com", details: "I want my data" },
    };
    await publicDsarController.submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      item: { id: 10, requestType: "access", status: "pending", createdAt: "2026-07-21T00:00:00Z" },
    });
    expect(dsarRequestDAO.create).toHaveBeenCalledWith({
      tenantId: 7,
      userId: null,
      requestType: "access",
      requestData: { email: "guest@example.com", details: "I want my data" },
      ipAddress: "127.0.0.1",
      userAgent: null,
    });
  });

  it("should return 400 when tenantSlug is missing", async () => {
    req.body = { requestType: "access" };
    await publicDsarController.submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "tenantSlug is required" });
  });

  it("should return 400 for invalid requestType", async () => {
    req.body = { tenantSlug: "bistro", requestType: "invalid_type" };
    await publicDsarController.submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining("Invalid requestType") });
  });

  it("should return 404 when tenant not found", async () => {
    db.tenant.findOne.mockResolvedValue(null);
    req.body = { tenantSlug: "nonexistent", requestType: "erasure" };
    await publicDsarController.submitHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Tenant not found" });
  });
});
