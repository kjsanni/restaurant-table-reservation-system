const { createIncidentHandler, deleteIncidentHandler, lockTenantHandler, resetTenantTokensHandler } = require("../tenant-platform/controllers/incident.controller");

jest.mock("../db/models", () => ({
  incident: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    destroy: jest.fn(),
  },
  tenant: {
    findByPk: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  user: { associate: jest.fn() },
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

jest.mock("../DAOs/auth.dao", () => ({
  getAllUsers: jest.fn(),
  revokeAllUserTokens: jest.fn(),
}));

const db = require("../db/models");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const authDAO = require("../DAOs/auth.dao");

function createReq(user = { id: 1 }, body = {}, params = {}) {
  return { user, body, params, ip: "127.0.0.1" };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  db.incident.create.mockResolvedValue({ id: 1, title: "Test" });
  db.incident.findByPk.mockResolvedValue({ id: 1, update: jest.fn() });
  db.tenant.findByPk.mockResolvedValue({ id: 1, name: "T", slug: "t", update: jest.fn() });
  authDAO.getAllUsers.mockResolvedValue([{ id: 1 }]);
  authDAO.revokeAllUserTokens.mockResolvedValue(true);
});

describe("incident.controller", () => {
  it("create ignores client-provided tenantId", async () => {
    const req = createReq({ id: 1 }, { title: "Test", tenantId: "999" });
    const res = createRes();
    await createIncidentHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.incident.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: null })
    );
  });

  it("create accepts valid fields without tenantId", async () => {
    const req = createReq({ id: 1 }, { title: "Test", severity: "high", affectedTenantIds: [1] });
    const res = createRes();
    await createIncidentHandler(req, res);
    expect(db.incident.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Test", severity: "high", affectedTenantIds: [1], tenantId: null })
    );
  });

  it("delete returns 404 when incident missing", async () => {
    db.incident.findByPk.mockResolvedValue(null);
    const req = createReq({ id: 1 }, {}, { id: "1" });
    const res = createRes();
    await deleteIncidentHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("lockTenant returns 404 when tenant missing", async () => {
    db.tenant.findByPk.mockResolvedValue(null);
    const req = createReq({ id: 1 }, {}, { tenantId: "99" });
    const res = createRes();
    await lockTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("resetTenantTokens revokes all tokens and returns count", async () => {
    db.tenant.findByPk.mockResolvedValue({ id: 1, name: "T", slug: "t" });
    authDAO.getAllUsers.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const req = createReq({ id: 1 }, {}, { tenantId: "1" });
    const res = createRes();
    await resetTenantTokensHandler(req, res);
    expect(authDAO.revokeAllUserTokens).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ usersReset: 2 }));
  });
});
