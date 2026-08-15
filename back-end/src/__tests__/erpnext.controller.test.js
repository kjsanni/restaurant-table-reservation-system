jest.mock("../db/models", () => ({
  tenant: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  user: {},
  Sequelize: { Op: { like: jest.fn() } },
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

jest.mock("../integrations/erpnext/module-registry", () => ({
  validateModuleDependencies: jest.fn(),
  getModuleMetadata: jest.fn(),
  getEnabledModules: jest.fn(),
}));

jest.mock("../integrations/erpnext/sync/orchestrator", () => ({
  enqueueFullSync: jest.fn(),
  enqueueCustomerSync: jest.fn(),
  enqueueInvoiceSync: jest.fn(),
  enqueuePaymentSync: jest.fn(),
  enqueueItemSync: jest.fn(),
  enqueueStockEntrySync: jest.fn(),
  enqueueEmployeeSync: jest.fn(),
  enqueueCrmCustomerSync: jest.fn(),
}));

const db = require("../db/models");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const {
  validateModuleDependencies,
  getModuleMetadata,
  getEnabledModules,
} = require("../integrations/erpnext/module-registry");
const orchestrator = require("../integrations/erpnext/sync/orchestrator");
const {
  listErpnextTenantsHandler,
  getErpnextTenantHandler,
  provisionErpnextModuleHandler,
  deprovisionErpnextModuleHandler,
  triggerSyncHandler,
  getSyncStatusHandler,
} = require("../tenant-platform/controllers/erpnext.controller");

const { createRes } = require("./utils/test-response");

function createReq(params = {}, body = {}, user = { id: 1, isSuperAdmin: true }, query = {}) {
  return { params, body, user, ip: "127.0.0.1", query };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("erpnext.controller", () => {
  describe("listErpnextTenantsHandler", () => {
    it("returns paginated tenants with erpnext modules", async () => {
      db.tenant.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [
          {
            id: 1,
            name: "Test Tenant",
            slug: "test",
            plan: "enterprise",
            settings: { featureFlags: { erpnext_accounting: true } },
            users: [{ id: 1 }],
          },
        ],
      });
      getEnabledModules.mockReturnValue(["erpnext_accounting"]);

      const req = createReq({}, {}, { id: 1, isSuperAdmin: true });
      const res = createRes();

      await listErpnextTenantsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          total: 1,
          collection: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              name: "Test Tenant",
              plan: "enterprise",
              erpnextModules: ["erpnext_accounting"],
              userCount: 1,
            }),
          ]),
        })
      );
    });
  });

  describe("getErpnextTenantHandler", () => {
    it("returns tenant ERPNext status", async () => {
      db.tenant.findByPk.mockResolvedValue({
        id: 1,
        name: "Test Tenant",
        plan: "enterprise",
        settings: {
          featureFlags: { erpnext_accounting: true },
          erpnextOnboardingStatus: { step: "complete" },
        },
      });
      getEnabledModules.mockReturnValue(["erpnext_accounting"]);

      const req = createReq({ id: 1 });
      const res = createRes();

      await getErpnextTenantHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tenantId: 1,
          tenantName: "Test Tenant",
          erpnextModules: ["erpnext_accounting"],
          onboardingStatus: { step: "complete" },
        })
      );
    });

    it("returns 404 when tenant not found", async () => {
      db.tenant.findByPk.mockResolvedValue(null);

      const req = createReq({ id: 999 });
      const res = createRes();

      await getErpnextTenantHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Tenant not found" });
    });
  });

  describe("provisionErpnextModuleHandler", () => {
    it("provisions a module and logs audit", async () => {
      const mockTenant = {
        id: 1,
        name: "Test Tenant",
        plan: "enterprise",
        settings: { featureFlags: {} },
        update: jest.fn(),
      };
      db.tenant.findByPk.mockResolvedValue(mockTenant);
      getModuleMetadata.mockReturnValue({ name: "Accounting", description: "Financial sync", dependencies: [] });
      validateModuleDependencies.mockReturnValue({ valid: true, missing: [] });

      const req = createReq({ id: 1 }, { module: "erpnext_accounting" });
      const res = createRes();

      await provisionErpnextModuleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            featureFlags: { erpnext_accounting: true },
          }),
        })
      );
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "erpnext.module_provisioned",
        "tenant",
        1,
        1,
        expect.objectContaining({ module: "erpnext_accounting", action: "provision" }),
        "127.0.0.1"
      );
    });

    it("returns 400 when module is missing", async () => {
      const req = createReq({ id: 1 }, {});
      const res = createRes();

      await provisionErpnextModuleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when tenant not found", async () => {
      db.tenant.findByPk.mockResolvedValue(null);

      const req = createReq({ id: 999 }, { module: "erpnext_accounting" });
      const res = createRes();

      await provisionErpnextModuleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deprovisionErpnextModuleHandler", () => {
    it("deprovisions a module and logs audit", async () => {
      const mockTenant = {
        id: 1,
        name: "Test Tenant",
        plan: "enterprise",
        settings: { featureFlags: { erpnext_accounting: true } },
        update: jest.fn(),
      };
      db.tenant.findByPk.mockResolvedValue(mockTenant);
      getModuleMetadata.mockReturnValue({ name: "Accounting", dependencies: [] });
      getEnabledModules.mockReturnValue([]);

      const req = createReq({ id: 1 }, { module: "erpnext_accounting" });
      const res = createRes();

      await deprovisionErpnextModuleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockTenant.update).toHaveBeenCalled();
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "erpnext.module_deprovisioned",
        "tenant",
        1,
        1,
        expect.objectContaining({ action: "deprovision" }),
        "127.0.0.1"
      );
    });

    it("returns 404 when tenant not found", async () => {
      db.tenant.findByPk.mockResolvedValue(null);

      const req = createReq({ id: 999 }, { module: "erpnext_accounting" });
      const res = createRes();

      await deprovisionErpnextModuleHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("triggerSyncHandler", () => {
    it("triggers full sync and enqueues job", async () => {
      const mockTenant = {
        id: 1,
        name: "Test Tenant",
        settings: { featureFlags: { erpnext_accounting: true } },
      };
      db.tenant.findByPk.mockResolvedValue(mockTenant);
      orchestrator.enqueueFullSync.mockResolvedValue({ enqueued: true });

      const req = createReq({ id: 1 }, { syncType: "full" });
      const res = createRes();

      await triggerSyncHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(orchestrator.enqueueFullSync).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "ERPNext full sync enqueued",
        })
      );
    });

    it("triggers customers sync with correct enqueue function", async () => {
      const mockTenant = {
        id: 1,
        name: "Test Tenant",
        settings: { featureFlags: { erpnext_accounting: true } },
      };
      db.tenant.findByPk.mockResolvedValue(mockTenant);
      orchestrator.enqueueCustomerSync.mockResolvedValue({ enqueued: true });

      const req = createReq({ id: 1 }, { syncType: "customers" });
      const res = createRes();

      await triggerSyncHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(orchestrator.enqueueCustomerSync).toHaveBeenCalledWith(1);
      expect(orchestrator.enqueueFullSync).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid sync type", async () => {
      const req = createReq({ id: 1 }, { syncType: "invalid" });
      const res = createRes();

      await triggerSyncHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 when no erpnext modules enabled", async () => {
      const mockTenant = {
        id: 1,
        name: "Test Tenant",
        settings: { featureFlags: {} },
      };
      db.tenant.findByPk.mockResolvedValue(mockTenant);

      const req = createReq({ id: 1 }, { syncType: "full" });
      const res = createRes();

      await triggerSyncHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 404 when tenant not found", async () => {
      db.tenant.findByPk.mockResolvedValue(null);

      const req = createReq({ id: 999 }, { syncType: "full" });
      const res = createRes();

      await triggerSyncHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getSyncStatusHandler", () => {
    it("returns sync status including onboarding status and last sync", async () => {
      db.tenant.findByPk.mockResolvedValue({
        id: 1,
        name: "Test Tenant",
        settings: {
          erpnextOnboardingStatus: { step: "complete" },
          erpnextLastSync: "2026-08-12T10:00:00Z",
        },
      });

      const req = createReq({ id: 1 });
      const res = createRes();

      await getSyncStatusHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tenantId: 1,
          onboardingStatus: { step: "complete" },
          lastSync: "2026-08-12T10:00:00Z",
        })
      );
    });

    it("returns 404 when tenant not found", async () => {
      db.tenant.findByPk.mockResolvedValue(null);

      const req = createReq({ id: 999 });
      const res = createRes();

      await getSyncStatusHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
