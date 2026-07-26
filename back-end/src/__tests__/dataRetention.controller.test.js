const dataRetentionController = require("../tenant-platform/controllers/dataRetention.controller");

jest.mock("../db/models");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("dataRetention.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 1 }, ip: "127.0.0.1", params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("listRetentionPoliciesHandler returns collection", async () => {
    const db = require("../db/models");
    db.dataRetentionPolicy.findAll.mockResolvedValue([]);
    await dataRetentionController.listRetentionPoliciesHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [] });
  });

  it("createRetentionPolicyHandler creates policy", async () => {
    const db = require("../db/models");
    db.dataRetentionPolicy.create.mockResolvedValue({ id: 1, name: "Test", dataCategory: "audit_logs", retentionDays: 90, action: "delete" });

    req.body = { name: "Test", dataCategory: "platform_audit_logs", retentionDays: 90, action: "delete" };
    await dataRetentionController.createRetentionPolicyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("deleteRetentionPolicyHandler deletes policy", async () => {
    const db = require("../db/models");
    db.dataRetentionPolicy.findByPk.mockResolvedValue({ id: 1, destroy: jest.fn() });

    req.params.id = 1;
    await dataRetentionController.deleteRetentionPolicyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("executeRetentionHandler runs cleanup", async () => {
    const db = require("../db/models");
    db.dataRetentionPolicy.findAll.mockResolvedValue([
      { id: 1, dataCategory: "platform_audit_logs", retentionDays: 90, isActive: true, update: jest.fn() },
    ]);
    db.platformAuditLog = { destroy: jest.fn().mockResolvedValue(0) };

    await dataRetentionController.executeRetentionHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
