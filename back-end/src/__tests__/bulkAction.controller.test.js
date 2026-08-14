"use strict";

jest.mock("../tenant-platform/DAOs/bulk.dao", () => ({
  suspendTenants: jest.fn(),
  changePlan: jest.fn(),
  sendEmail: jest.fn(),
  changeVertical: jest.fn(),
  enableTenants: jest.fn(),
  exportTenants: jest.fn(),
  assignFeatureFlags: jest.fn(),
  deleteTenants: jest.fn(),
  bulkProvision: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  protect: jest.fn((req, res, next) => next()),
  requirePermission: jest.fn(() => (req, res, next) => next()),
  _requirePermission: jest.fn(),
}));

const bulkDAO = require("../tenant-platform/DAOs/bulk.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const bulkController = require("../tenant-platform/controllers/bulkAction.controller");

describe("bulkAction.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, ip: "127.0.0.1", user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("bulkEnableHandler returns 200", async () => {
    bulkDAO.enableTenants.mockResolvedValue(2);
    req.body.tenantIds = [1, 2];
    await bulkController.bulkEnableHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Re-enabled 2 tenants" });
  });

  it("bulkExportHandler returns 200 with collection", async () => {
    bulkDAO.exportTenants.mockResolvedValue([{ id: 1, name: "T1" }]);
    req.body.tenantIds = [1];
    await bulkController.bulkExportHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [{ id: 1, name: "T1" }] });
  });

  it("bulkAssignFeatureFlagsHandler returns 200", async () => {
    bulkDAO.assignFeatureFlags.mockResolvedValue(1);
    req.body.tenantIds = [1];
    req.body.featureFlags = { loyalty: true };
    await bulkController.bulkAssignFeatureFlagsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Updated feature flags for 1 tenants" });
  });

  it("bulkDeleteHandler returns 200", async () => {
    bulkDAO.deleteTenants.mockResolvedValue(1);
    req.body.tenantIds = [1];
    await bulkController.bulkDeleteHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Deleted 1 tenants" });
  });

  it("bulkProvisionHandler returns 200 with results", async () => {
    bulkDAO.bulkProvision.mockResolvedValue([{ tenantId: 1, status: "completed" }]);
    req.body.tenantIds = [1];
    await bulkController.bulkProvisionHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      results: [{ tenantId: 1, status: "completed" }],
    });
  });
});
