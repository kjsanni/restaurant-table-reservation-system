const platformAuditController = require("../tenant-platform/controllers/platformAudit.controller");

jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("platformAudit.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("exportAuditLogHandler returns csv", async () => {
    const dao = require("../tenant-platform/DAOs/platformAudit.dao");
    dao.list.mockResolvedValue([{ id: 1, action: "test", entityType: "user", entityId: 1, tenantId: 1, actorUserId: 1, ipAddress: "127.0.0.1", createdAt: new Date(), metadata: {} }]);
    req.query.format = "csv";
    await platformAuditController.exportAuditLogHandler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=audit-log.csv");
    expect(res.send).toHaveBeenCalled();
  });

  it("exportAuditLogHandler returns json by default", async () => {
    const dao = require("../tenant-platform/DAOs/platformAudit.dao");
    dao.list.mockResolvedValue([]);
    await platformAuditController.exportAuditLogHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [] });
  });
});
