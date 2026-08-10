const db = require("../db/models");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const tenantAdminDAO = require("../tenant-platform/DAOs/tenantAdmin.dao");
const tenantAdminController = require("../tenant-platform/controllers/tenantAdmin.controller");

jest.mock("../db/models");
jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../tenant-platform/DAOs/tenantAdmin.dao", () => ({
  findBySlug: jest.fn(),
  create: jest.fn(),
  list: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  setStatus: jest.fn(),
  softDelete: jest.fn(),
  export: jest.fn(),
  log: jest.fn(),
}));

describe("tenantAdminController.deleteTenantHandler", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { id: "1" },
      user: { id: 99 },
      ip: "127.0.0.1",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    db.tenant = {
      findByPk: jest.fn(),
      findAndCountAll: jest.fn(),
    };
    db.setting = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    db.note = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    db.legalAcceptance = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    platformAuditDAO.log = jest.fn().mockResolvedValue(undefined);
    tenantAdminDAO.softDelete = jest.fn();
    tenantAdminDAO.log = jest.fn();
  });

  it("returns 404 when tenant does not exist", async () => {
    tenantAdminDAO.softDelete.mockResolvedValue(null);

    await tenantAdminController.deleteTenantHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Tenant not found" });
  });

  it("returns 400 when tenant is already cancelled", async () => {
    const err = new Error("Tenant is already deleted");
    err.status = 400;
    err.isAlreadyDeleted = true;
    tenantAdminDAO.softDelete.mockRejectedValue(err);

    await tenantAdminController.deleteTenantHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Tenant is already deleted" });
  });

  it("soft-deletes an active tenant and logs audit", async () => {
    const tenant = { id: 1, name: "Acme", slug: "acme", status: "cancelled" };
    tenantAdminDAO.softDelete.mockResolvedValue(tenant);

    await tenantAdminController.deleteTenantHandler(req, res);

    expect(tenantAdminDAO.softDelete).toHaveBeenCalledWith("1");
    expect(tenantAdminDAO.log).toHaveBeenCalledWith(
      99,
      "tenant.deleted",
      "tenant",
      1,
      1,
      { tenantId: 1, tenantName: "Acme", tenantSlug: "acme" },
      "127.0.0.1"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Tenant deleted successfully",
        item: expect.objectContaining({
          id: 1,
          name: "Acme",
          slug: "acme",
          status: "cancelled",
        }),
      })
    );
  });

  describe("getTenantsHandler", () => {
    it("passes search query to DAO and returns paginated tenants", async () => {
      req.query = { page: "1", pageSize: "20", search: "acme" };
      tenantAdminDAO.list.mockResolvedValue({
        rows: [{ id: 1, name: "Acme", slug: "acme" }],
        count: 1,
      });

      await tenantAdminController.getTenantsHandler(req, res);

      expect(tenantAdminDAO.list).toHaveBeenCalledWith({
        status: undefined,
        plan: undefined,
        search: "acme",
        page: "1",
        pageSize: "20",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: [{ id: 1, name: "Acme", slug: "acme" }],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    });

    it("returns empty collection when search matches nothing", async () => {
      req.query = { page: "1", pageSize: "20", search: "nonexistent" };
      tenantAdminDAO.list.mockResolvedValue({
        rows: [],
        count: 0,
      });

      await tenantAdminController.getTenantsHandler(req, res);

      expect(tenantAdminDAO.list).toHaveBeenCalledWith({
        status: undefined,
        plan: undefined,
        search: "nonexistent",
        page: "1",
        pageSize: "20",
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        collection: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
    });
  });
});
