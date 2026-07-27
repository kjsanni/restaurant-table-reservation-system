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

  describe("exportTenantDataHandler", () => {
    it("returns 404 when tenant does not exist", async () => {
      tenantAdminDAO.export.mockResolvedValue(null);

      await tenantAdminController.exportTenantDataHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Tenant not found" });
    });

    it("exports tenant data with related records", async () => {
      const tenant = {
        id: 1,
        name: "Acme",
        slug: "acme",
        toJSON: jest.fn().mockReturnValue({ id: 1, name: "Acme", slug: "acme" }),
      };
      tenantAdminDAO.export.mockResolvedValue({
        tenant,
        settings: [{ key: "theme", value: "dark", updatedAt: "2026-01-01" }],
        notes: [{ id: 1, note: "test", createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
        legalAcceptances: [{ id: 1, documentVersion: "1.0", acceptedAt: "2026-01-01", ipAddress: "1.2.3.4", userAgent: "test" }],
      });

      await tenantAdminController.exportTenantDataHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg.success).toBe(true);
      expect(responseArg.data.tenant).toEqual({ id: 1, name: "Acme", slug: "acme" });
      expect(responseArg.data.settings).toEqual([{ key: "theme", value: "dark", updatedAt: "2026-01-01" }]);
      expect(responseArg.data.notes).toEqual([{ id: 1, note: "test", createdAt: "2026-01-01", updatedAt: "2026-01-01" }]);
      expect(responseArg.data.legalAcceptances).toEqual([{ id: 1, documentVersion: "1.0", acceptedAt: "2026-01-01", ipAddress: "1.2.3.4", userAgent: "test" }]);
      expect(responseArg.data.exportedAt).toBeDefined();
    });
  });
});
