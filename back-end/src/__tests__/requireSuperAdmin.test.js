const { requireSuperAdmin } = require("../middleware/auth");

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn().mockResolvedValue({}),
}));

const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

function createReq(user = null, tenant = null) {
  return {
    user,
    tenant,
    path: "/api/v1/admin/tenants",
    method: "GET",
    ip: "127.0.0.1",
  };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe("requireSuperAdmin middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows a user with isSuperAdmin=true", () => {
    const req = createReq({ id: 1, email: "admin@rtrs.com", isSuperAdmin: true });
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(platformAuditDAO.log).not.toHaveBeenCalled();
  });

  it("denies a regular admin without isSuperAdmin", () => {
    const req = createReq({ id: 2, email: "tenant-admin@example.com", isSuperAdmin: false });
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Super admin access required!",
    });
    expect(platformAuditDAO.log).toHaveBeenCalledTimes(1);
  });

  it("denies staff users", () => {
    const req = createReq({ id: 3, email: "staff@example.com", isSuperAdmin: false });
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(platformAuditDAO.log).toHaveBeenCalledTimes(1);
  });

  it("denies unauthenticated requests", () => {
    const req = createReq(null);
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Super admin access required!",
    });
    expect(platformAuditDAO.log).toHaveBeenCalledTimes(1);
  });

  it("logs tenant context when tenant is resolved", () => {
    const req = createReq(
      { id: 4, email: "tenant-admin@example.com", isSuperAdmin: false },
      { id: 1, name: "Default Tenant" }
    );
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(platformAuditDAO.log).toHaveBeenCalledWith(
      4,
      "super_admin.access_denied",
      "admin",
      null,
      1,
      { path: "/api/v1/admin/tenants", method: "GET", ipAddress: "127.0.0.1" },
      "127.0.0.1"
    );
  });

  it("logs null actorUserId when user is missing", () => {
    const req = createReq(null, { id: 1, name: "Default Tenant" });
    const res = createRes();
    const next = jest.fn();

    requireSuperAdmin(req, res, next);

    expect(platformAuditDAO.log).toHaveBeenCalledWith(
      null,
      "super_admin.access_denied",
      "admin",
      null,
      1,
      { path: "/api/v1/admin/tenants", method: "GET", ipAddress: "127.0.0.1" },
      "127.0.0.1"
    );
  });
});
