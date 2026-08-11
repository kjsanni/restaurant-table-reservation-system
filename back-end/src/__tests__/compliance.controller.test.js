const db = require("../db/models");
const complianceController = require("../tenant-platform/controllers/compliance.controller");
const legalAcceptanceDAO = require("../tenant-platform/DAOs/legalAcceptance.dao");
const dsarRequestDAO = require("../tenant-platform/DAOs/dsarRequest.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

jest.mock("../db/models", () => ({
  tenant: { count: jest.fn() },
}));

jest.mock("../tenant-platform/DAOs/legalAcceptance.dao", () => ({
  list: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/dsarRequest.dao", () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
  listByTenant: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

describe("compliance.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 1 }, ip: "127.0.0.1" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getComplianceScorecardHandler returns scorecard", async () => {
    db.tenant.count.mockResolvedValueOnce(5);
    legalAcceptanceDAO.list.mockResolvedValueOnce([
      { documentKey: "privacy_policy", accepted: true },
      { documentKey: "terms_of_service", accepted: true },
    ]);
    await complianceController.getComplianceScorecardHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.scorecard.totalTenants).toBe(5);
  });

  it("autoFulfillSimpleDsarHandler fulfills pending DSAR", async () => {
    req.body = { requestId: 1 };
    dsarRequestDAO.findById.mockResolvedValue({ id: 1, tenantId: 1, status: "pending", requestType: "access" });
    dsarRequestDAO.updateStatus.mockResolvedValue(true);
    await complianceController.autoFulfillSimpleDsarHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, message: "DSAR request auto-fulfilled" });
  });

  it("autoFulfillSimpleDsarHandler returns 400 for non-request", async () => {
    req.body = { requestId: 999 };
    dsarRequestDAO.findById.mockResolvedValue(null);
    await complianceController.autoFulfillSimpleDsarHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("scheduleComplianceRemindersHandler returns reminders", async () => {
    legalAcceptanceDAO.list.mockResolvedValue([
      { id: 1, tenantId: 1, documentKey: "privacy_policy", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { id: 2, tenantId: 2, documentKey: "terms_of_service", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ]);
    await complianceController.scheduleComplianceRemindersHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.totalPending).toBe(2);
  });

  it("generateComplianceReportHandler returns report", async () => {
    db.tenant.count.mockResolvedValueOnce(5);
    legalAcceptanceDAO.list.mockResolvedValueOnce([
      { documentKey: "privacy_policy", accepted: true },
    ]).mockResolvedValueOnce([
      { documentKey: "terms_of_service", accepted: false },
    ]);
    dsarRequestDAO.listByTenant.mockResolvedValue([
      { id: 1, status: "pending" },
      { id: 2, status: "fulfilled" },
    ]);
    await complianceController.generateComplianceReportHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(data.report.scorecard).toBeDefined();
    expect(data.report.pendingDsarCount).toBe(1);
  });
});