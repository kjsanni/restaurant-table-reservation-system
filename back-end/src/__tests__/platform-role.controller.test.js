const platformRoleController = require("../controllers/platform-role.controller");

const authDAO = require("../DAOs/auth.dao");

jest.mock("../DAOs/auth.dao", () => ({
  listPlatformUsers: jest.fn(),
  createPlatformUser: jest.fn(),
  validatePasswordComplexity: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock("../db/models", () => ({
  user: {
    findByPk: jest.fn(),
  },
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(() => Promise.resolve()),
}));

const db = require("../db/models");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1, platformRoles: ["platform_admin"] }) {
  return {
    user,
    tenant: { id: 1 },
    ip: "127.0.0.1",
  };
}

describe("platform-role.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listPlatformRolesHandler", () => {
    it("returns list of platform roles", async () => {
      const req = createReq();
      const res = createRes();
      await platformRoleController.listPlatformRolesHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        roles: expect.arrayContaining([
          expect.objectContaining({ key: "platform_admin", label: "Platform Admin" }),
          expect.objectContaining({ key: "platform_billing", label: "Billing Admin" }),
          expect.objectContaining({ key: "platform_support", label: "Support Admin" }),
        ]),
      });
    });
  });

  describe("assignPlatformRoleHandler", () => {
    it("returns 400 when userId or role is missing", async () => {
      const req = createReq();
      const res = createRes();
      await platformRoleController.assignPlatformRoleHandler({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when role is invalid", async () => {
      const req = createReq();
      const res = createRes();
      await platformRoleController.assignPlatformRoleHandler({ body: { userId: 1, role: "invalid" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid platform role" });
    });

    it("returns 404 when user not found", async () => {
      db.user.findByPk.mockResolvedValue(null);
      const req = createReq();
      const res = createRes();
      await platformRoleController.assignPlatformRoleHandler({ body: { userId: 999, role: "platform_billing" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("assigns role to user and logs audit", async () => {
      const mockUser = {
        id: 1,
        platformRoles: [],
        save: jest.fn().mockResolvedValue(true),
      };
      db.user.findByPk.mockResolvedValue(mockUser);
      const req = createReq();
      const res = createRes();
      await platformRoleController.assignPlatformRoleHandler({ body: { userId: 1, role: "platform_billing" }, user: req.user, tenant: { id: 1 }, ip: "127.0.0.1" }, res);
      expect(mockUser.platformRoles).toEqual(["platform_billing"]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        expect.any(Number),
        "platform_role_assigned",
        "user",
        1,
        1,
        { role: "platform_billing", assignedBy: 1 },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("revokePlatformRoleHandler", () => {
    it("returns 400 when userId or role is missing", async () => {
      const req = createReq();
      const res = createRes();
      await platformRoleController.revokePlatformRoleHandler({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 404 when user not found", async () => {
      db.user.findByPk.mockResolvedValue(null);
      const req = createReq();
      const res = createRes();
      await platformRoleController.revokePlatformRoleHandler({ body: { userId: 999, role: "platform_billing" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("revokes role from user and logs audit", async () => {
      const mockUser = {
        id: 1,
        platformRoles: ["platform_admin", "platform_billing"],
        save: jest.fn().mockResolvedValue(true),
      };
      db.user.findByPk.mockResolvedValue(mockUser);
      const req = createReq();
      const res = createRes();
      await platformRoleController.revokePlatformRoleHandler({ body: { userId: 1, role: "platform_billing" }, user: req.user, tenant: { id: 1 }, ip: "127.0.0.1" }, res);
      expect(mockUser.platformRoles).toEqual(["platform_admin"]);
      expect(mockUser.save).toHaveBeenCalled();
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        expect.any(Number),
        "platform_role_revoked",
        "user",
        1,
        1,
        { role: "platform_billing", revokedBy: 1 },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("listPlatformUsersHandler", () => {
    it("returns list of platform users", async () => {
      const mockUsers = [
        { id: 1, username: "admin1", email: "admin1@co.com", role: "admin", isSuperAdmin: true, platformRoles: [] },
      ];
      authDAO.listPlatformUsers.mockResolvedValue({ users: mockUsers, total: mockUsers.length });
      const req = createReq();
      req.query = {};
      const res = createRes();
      await platformRoleController.listPlatformUsersHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, users: mockUsers, total: mockUsers.length });
    });

    it("returns empty list when no platform users", async () => {
      authDAO.listPlatformUsers.mockResolvedValue({ users: [], total: 0 });
      const req = createReq();
      req.query = {};
      const res = createRes();
      await platformRoleController.listPlatformUsersHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, users: [], total: 0 });
    });
  });

  describe("createPlatformUserHandler", () => {
    it("returns 400 when username, email, or password is missing", async () => {
      const res = createRes();
      await platformRoleController.createPlatformUserHandler({ body: {}, user: createReq().user, ip: "127.0.0.1" }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "username, email, and password are required" });
    });

    it("returns 400 when password complexity fails", async () => {
      authDAO.createPlatformUser.mockRejectedValue({ status: 400, message: "Password must be at least 12 characters long." });
      const res = createRes();
      await platformRoleController.createPlatformUserHandler({
        body: { username: "test", email: "test@co.com", password: "weak" },
        user: createReq().user,
        ip: "127.0.0.1",
      }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 when email already exists", async () => {
      authDAO.createPlatformUser.mockRejectedValue({ status: 409, message: "A platform user with this email already exists!" });
      const res = createRes();
      await platformRoleController.createPlatformUserHandler({
        body: { username: "test", email: "test@co.com", password: "StrongPass123!" },
        user: createReq().user,
        ip: "127.0.0.1",
      }, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("creates platform user and logs audit", async () => {
      const mockUser = {
        id: 1,
        username: "newadmin",
        email: "newadmin@co.com",
        role: "admin",
        isSuperAdmin: false,
        platformRoles: ["platform_billing"],
        tenantId: null,
      };
      authDAO.createPlatformUser.mockResolvedValue(mockUser);
      const req = createReq();
      const res = createRes();
      await platformRoleController.createPlatformUserHandler({
        body: { username: "newadmin", email: "newadmin@co.com", password: "StrongPass123!", role: "admin", isSuperAdmin: false, platformRoles: ["platform_billing"] },
        user: req.user,
        ip: "127.0.0.1",
      }, res);
      expect(authDAO.createPlatformUser).toHaveBeenCalledWith({
        username: "newadmin",
        email: "newadmin@co.com",
        password: "StrongPass123!",
        role: "admin",
        isSuperAdmin: false,
        platformRoles: ["platform_billing"],
      });
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "platform_user_created",
        "user",
        1,
        null,
        { username: "newadmin", email: "newadmin@co.com", role: "admin", isSuperAdmin: false, platformRoles: ["platform_billing"] },
        "127.0.0.1"
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Platform user created successfully!",
        user: mockUser,
      });
    });
  });
});
