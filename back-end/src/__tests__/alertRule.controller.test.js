const { listAlertRulesHandler, createAlertRuleHandler, updateAlertRuleHandler, deleteAlertRuleHandler } = require("../tenant-platform/controllers/alertRule.controller");

jest.mock("../tenant-platform/DAOs/alertRule.dao", () => ({
  list: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const alertRuleDAO = require("../tenant-platform/DAOs/alertRule.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, ip: "127.0.0.1" };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("alertRule.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create rejects when name is missing", async () => {
    const req = createReq({ id: 1 }, { metric: "cpu_usage" });
    const res = createRes();
    await createAlertRuleHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("create accepts whitelisted fields and logs audit", async () => {
    alertRuleDAO.create.mockResolvedValue({ id: 1, name: "CPU alert", metric: "cpu_usage" });
    const req = createReq({ id: 1 }, { name: "CPU alert", metric: "cpu_usage", threshold: 90, isActive: true });
    const res = createRes();
    await createAlertRuleHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(alertRuleDAO.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "CPU alert", metric: "cpu_usage", threshold: 90, isActive: true })
    );
    expect(platformAuditDAO.log).toHaveBeenCalled();
  });

  it("create strips non-whitelisted fields", async () => {
    alertRuleDAO.create.mockResolvedValue({ id: 1 });
    const req = createReq({ id: 1 }, { name: "Test", metric: "cpu_usage", maliciousField: "ignored" });
    const res = createRes();
    await createAlertRuleHandler(req, res);
    expect(alertRuleDAO.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ maliciousField: "ignored" })
    );
  });

  it("update fetches first then applies whitelist", async () => {
    alertRuleDAO.findById.mockResolvedValue({ id: 5 });
    alertRuleDAO.update.mockResolvedValue({ id: 5, name: "Updated" });
    const req = createReq({ id: 1 }, { name: "Updated", malicious: "ignored" }, { id: "5" });
    const res = createRes();
    await updateAlertRuleHandler(req, res);
    expect(alertRuleDAO.findById).toHaveBeenCalledWith("5");
    expect(alertRuleDAO.update).toHaveBeenCalledWith("5", expect.not.objectContaining({ malicious: "ignored" }));
  });

  it("delete returns 404 when missing", async () => {
    alertRuleDAO.remove.mockResolvedValue(null);
    const req = createReq({ id: 1 }, {}, { id: "5" });
    const res = createRes();
    await deleteAlertRuleHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
