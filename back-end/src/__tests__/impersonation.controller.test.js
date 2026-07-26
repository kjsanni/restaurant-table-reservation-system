const impersonationDAO = require("../tenant-platform/DAOs/impersonation.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const impersonationController = require("../tenant-platform/controllers/impersonation.controller");

jest.mock("../tenant-platform/DAOs/impersonation.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");
jest.mock("../db/models", () => ({
  user: { findByPk: jest.fn() },
}));

describe("impersonation.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: 1 }, ip: "127.0.0.1" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("startImpersonationHandler creates session", async () => {
    require("../db/models").user.findByPk.mockResolvedValue({ id: 2, email: "user@test.com", isSuperAdmin: false });
    impersonationDAO.createSession.mockResolvedValue({
      id: 1,
      token: "imp-token",
      expiresAt: new Date(),
    });
    req.body.tenantUserId = 2;
    req.body.reason = "Support";
    await impersonationController.startImpersonationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: "imp-token", expiresAt: expect.any(Date) });
  });

  it("endImpersonationHandler ends session", async () => {
    impersonationDAO.endSession.mockResolvedValue({ id: 1 });
    req.params.id = 1;
    await impersonationController.endImpersonationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it("listImpersonationHandler returns sessions", async () => {
    impersonationDAO.listSessions.mockResolvedValue([{ id: 1 }]);
    await impersonationController.listImpersonationHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, collection: [{ id: 1 }] });
  });
});
