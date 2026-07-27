const maintenanceController = require("../tenant-platform/controllers/maintenance.controller");

jest.mock("../db/models", () => ({
  setting: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao");

describe("maintenance.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { user: { id: 1 }, ip: "127.0.0.1", body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getMaintenanceModeHandler returns current state", async () => {
    const db = require("../db/models");
    db.setting.findOne.mockResolvedValue({ value: true });

    await maintenanceController.getMaintenanceModeHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, enabled: true }));
  });

  it("setMaintenanceModeHandler updates state", async () => {
    const db = require("../db/models");
    db.setting.findOne.mockResolvedValue(null);
    db.setting.create.mockResolvedValue({ id: 1, value: { enabled: true, message: "test", startedAt: new Date() } });

    req.body = { enabled: true, message: "test" };
    await maintenanceController.setMaintenanceModeHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, enabled: true }));
  });
});
