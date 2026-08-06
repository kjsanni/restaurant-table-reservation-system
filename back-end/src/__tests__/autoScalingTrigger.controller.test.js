const { listAutoScalingTriggersHandler, createAutoScalingTriggerHandler, updateAutoScalingTriggerHandler, deleteAutoScalingTriggerHandler } = require("../tenant-platform/controllers/autoScalingTrigger.controller");

jest.mock("../tenant-platform/DAOs/autoScalingTrigger.dao", () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const autoScalingTriggerDAO = require("../tenant-platform/DAOs/autoScalingTrigger.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, query: {}, ip: "127.0.0.1" };
}

describe("autoScalingTrigger.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create rejects when name, metric or action missing", async () => {
    const req = createReq({ id: 1 }, {});
    const res = createRes();
    await createAutoScalingTriggerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("create strips non-whitelisted fields and logs audit", async () => {
    autoScalingTriggerDAO.create.mockResolvedValue({ id: 1, name: "CPU", metric: "cpu_usage" });
    const req = createReq({ id: 1 }, { name: "CPU", metric: "cpu_usage", action: "alert", malicious: "ignored" });
    const res = createRes();
    await createAutoScalingTriggerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(autoScalingTriggerDAO.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ malicious: "ignored" })
    );
    expect(platformAuditDAO.log).toHaveBeenCalled();
  });

  it("update fetches first then applies whitelist", async () => {
    autoScalingTriggerDAO.findById.mockResolvedValue({ id: 5 });
    autoScalingTriggerDAO.update.mockResolvedValue({ id: 5, name: "Updated" });
    const req = createReq({ id: 1 }, { name: "Updated" }, { id: "5" });
    const res = createRes();
    await updateAutoScalingTriggerHandler(req, res);
    expect(autoScalingTriggerDAO.findById).toHaveBeenCalledWith("5");
    expect(autoScalingTriggerDAO.update).toHaveBeenCalledWith("5", expect.not.objectContaining({ malicious: "ignored" }));
  });

  it("delete returns 404 when missing", async () => {
    autoScalingTriggerDAO.remove.mockResolvedValue(null);
    const req = createReq({ id: 1 }, {}, { id: "5" });
    const res = createRes();
    await deleteAutoScalingTriggerHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
