process.env.JWT_SECRET = "current-secret-key-here-1234567890123456789012345678";
process.env.TENANT_MODE = "enabled";

jest.mock("../DAOs/auth.dao");
jest.mock("../DAOs/role.dao");
jest.mock("../tenant-platform/DAOs/platformAudit.dao");
jest.mock("../utils/jwtRotation");

const makeReq = (overrides = {}) => ({
  cookies: {},
  headers: {},
  path: "/api/v1/reservations",
  ip: "127.0.0.1",
  method: "GET",
  ...overrides,
});

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    const jwtRotation = require("../utils/jwtRotation");
    jwtRotation.verifyTokenWithFallback.mockReturnValue({ userId: 1 });
    jwtRotation.getCurrentSecret.mockReturnValue("test-secret");

    const authDAO = require("../DAOs/auth.dao");
    authDAO.findUserById.mockResolvedValue({
      id: 1,
      email: "user@test.com",
      role: "staff",
      permissions: { view_reservations: true, edit_reservations: true },
      tenantId: 10,
    });

    const roleDAO = require("../DAOs/role.dao");
    roleDAO.getRolePermissions.mockResolvedValue(null);

    const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
    platformAuditDAO.log = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.TENANT_MODE;
  });

  describe("protect", () => {
    it("returns 401 when no token is present", async () => {
      const jwtRotation = require("../utils/jwtRotation");
      jwtRotation.verifyTokenWithFallback.mockReturnValue(undefined);
      const middleware = require("../middleware/auth");
      const req = makeReq();
      const res = makeRes();

      await middleware.protect(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized, no token!",
      });
    });

    it("accepts token from Authorization Bearer header", async () => {
      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    it("accepts token from cookie", async () => {
      const middleware = require("../middleware/auth");
      const req = makeReq({ cookies: { token: "cookie-token" } });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it("returns 401 when user does not exist", async () => {
      const authDAO = require("../DAOs/auth.dao");
      authDAO.findUserById.mockResolvedValue(null);
      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();

      await middleware.protect(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User no longer exists!",
      });
    });

    it("populates permissions from role dao when empty", async () => {
      const authDAO = require("../DAOs/auth.dao");
      authDAO.findUserById.mockResolvedValue({
        id: 1,
        email: "user@test.com",
        role: "staff",
        permissions: {},
        tenantId: 10,
      });
      const roleDAO = require("../DAOs/role.dao");
      roleDAO.getRolePermissions.mockResolvedValue({ view_reservations: true });

      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.user.permissions).toEqual({ view_reservations: true });
      expect(next).toHaveBeenCalled();
    });

    it("returns 500 when permission lookup throws", async () => {
      const authDAO = require("../DAOs/auth.dao");
      authDAO.findUserById.mockResolvedValue({
        id: 1,
        email: "user@test.com",
        role: "staff",
        permissions: {},
        tenantId: 10,
      });
      const roleDAO = require("../DAOs/role.dao");
      roleDAO.getRolePermissions.mockRejectedValue(new Error("DB error"));

      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.user.permissions).toEqual({});
      expect(next).toHaveBeenCalled();
    });

    it("loads tenant from DB when TENANT_MODE=enabled and user has tenantId", async () => {
      const db = require("../db/models");
      db.tenant = {
        findByPk: jest.fn().mockResolvedValue({ id: 10, name: "Tenant A", toJSON: () => ({ id: 10, name: "Tenant A" }) }),
      };

      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.tenant).toEqual(expect.objectContaining({ id: 10, name: "Tenant A" }));
      expect(next).toHaveBeenCalled();
    });

    it("returns 403 when user has tenantId but tenant record is missing", async () => {
      const authDAO = require("../DAOs/auth.dao");
      authDAO.findUserById.mockResolvedValue({
        id: 1,
        email: "user@test.com",
        role: "staff",
        permissions: {},
        tenantId: 10,
      });
      const db = require("../db/models");
      db.tenant = {
        findByPk: jest.fn().mockResolvedValue(null),
      };

      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" } });
      const res = makeRes();

      await middleware.protect(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Your account is not assigned to a tenant.",
      });
    });

    it("clears spoofed tenant on admin route for platform user", async () => {
      const authDAO = require("../DAOs/auth.dao");
      authDAO.findUserById.mockResolvedValue({
        id: 1,
        email: "admin@test.com",
        role: "admin",
        permissions: {},
        tenantId: null,
        isSuperAdmin: true,
        platformRoles: ["platform_admin"],
      });

      const db = require("../db/models");
      db.tenant = {
        findByPk: jest.fn().mockResolvedValue(null),
      };

      const middleware = require("../middleware/auth");
      const req = makeReq({ headers: { authorization: "Bearer valid-token" }, path: "/api/v1/admin/notifications" });
      const res = makeRes();
      const next = jest.fn();

      await middleware.protect(req, res, next);

      expect(req.tenant).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("requirePermission", () => {
    it("calls next when user has the required permission", async () => {
      const req = makeReq({ user: { permissions: { delete_orders: true } } });
      const res = makeRes();
      require("../middleware/auth").requirePermission("delete_orders")(req, res, jest.fn());

      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 when user lacks the required permission", async () => {
      const req = makeReq({ user: { permissions: { view_orders: true } } });
      const res = makeRes();
      require("../middleware/auth").requirePermission("delete_orders")(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Permission denied: delete_orders required!",
      });
    });

    it("returns 401 when req.user is missing", async () => {
      const req = makeReq({ user: undefined });
      const res = makeRes();
      require("../middleware/auth").requirePermission("view_orders")(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized!",
      });
    });
  });

  describe("admin", () => {
    it("calls next for admin role", async () => {
      const req = makeReq({ user: { role: "admin" } });
      const res = makeRes();
      require("../middleware/auth").admin(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 for non-admin role", async () => {
      const req = makeReq({ user: { role: "staff" } });
      const res = makeRes();
      require("../middleware/auth").admin(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("staff", () => {
    it("calls next for admin role", async () => {
      const req = makeReq({ user: { role: "admin" } });
      const res = makeRes();
      require("../middleware/auth").staff(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("calls next for staff role", async () => {
      const req = makeReq({ user: { role: "staff" } });
      const res = makeRes();
      require("../middleware/auth").staff(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 for customer role", async () => {
      const req = makeReq({ user: { role: "customer" } });
      const res = makeRes();
      require("../middleware/auth").staff(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("staffOnly", () => {
    it("calls next for staff role", async () => {
      const req = makeReq({ user: { role: "staff" } });
      const res = makeRes();
      require("../middleware/auth").staffOnly(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 for admin role", async () => {
      const req = makeReq({ user: { role: "admin" } });
      const res = makeRes();
      require("../middleware/auth").staffOnly(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("customer", () => {
    it("calls next for customer role", async () => {
      const req = makeReq({ user: { role: "customer" } });
      const res = makeRes();
      require("../middleware/auth").customer(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 for staff role", async () => {
      const req = makeReq({ user: { role: "staff" } });
      const res = makeRes();
      require("../middleware/auth").customer(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requireSuperAdmin", () => {
    it("calls next for super admin", async () => {
      const req = makeReq({ user: { id: 1, isSuperAdmin: true } });
      const res = makeRes();
      require("../middleware/auth").requireSuperAdmin(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("calls next for platform admin role", async () => {
      const req = makeReq({ user: { id: 1, isSuperAdmin: false, platformRoles: ["platform_admin"] } });
      const res = makeRes();
      require("../middleware/auth").requireSuperAdmin(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 and logs for non-super-admin", async () => {
      const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
      const req = makeReq({ user: { id: 1, isSuperAdmin: false, platformRoles: [] }, tenant: { id: 10 } });
      const res = makeRes();

      require("../middleware/auth").requireSuperAdmin(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Super admin access required!",
      });
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "super_admin.access_denied",
        "admin",
        null,
        10,
        { path: "/api/v1/reservations", method: "GET", ipAddress: "127.0.0.1" },
        "127.0.0.1"
      );
    });
  });

  describe("requirePlatformRole", () => {
    it("calls next when user has the required role", async () => {
      const req = makeReq({ user: { id: 1, isSuperAdmin: false, platformRoles: ["tenant_admin"] } });
      const res = makeRes();
      require("../middleware/auth").requirePlatformRole("tenant_admin")(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("calls next when user is super admin regardless of role", async () => {
      const req = makeReq({ user: { id: 1, isSuperAdmin: true, platformRoles: [] } });
      const res = makeRes();
      require("../middleware/auth").requirePlatformRole("tenant_admin")(req, res, jest.fn());
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 403 when user lacks the required role", async () => {
      const req = makeReq({ user: { id: 1, isSuperAdmin: false, platformRoles: [] }, tenant: { id: 10 } });
      const res = makeRes();
      require("../middleware/auth").requirePlatformRole("tenant_admin")(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Platform role 'tenant_admin' required!",
      });
    });
  });
});
