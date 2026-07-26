const trustSafetyController = require("../tenant-platform/controllers/trustSafety.controller");

jest.mock("../db/models", () => ({
  tenant: { findAll: jest.fn() },
  platformAuditLog: { count: jest.fn() },
  supportTicket: { count: jest.fn() },
  Sequelize: { Op: { ne: "ne", gte: "gte", in: "in" } },
}));

describe("trustSafety.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getTenantHealthScoresHandler returns scores", async () => {
    const db = require("../db/models");
    db.tenant.findAll.mockResolvedValue([{ id: 1, name: "T1", plan: "starter", status: "active" }]);
    db.platformAuditLog.count.mockResolvedValue(0);
    db.supportTicket.count.mockResolvedValue(0);

    await trustSafetyController.getTenantHealthScoresHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
