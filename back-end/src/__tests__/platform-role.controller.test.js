const platformRoleController = require("../controllers/platform-role.controller");

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

function createReq(user = { id: 1, platformRoles: ["platform_admin"] }) {
  return {
    user,
    tenant: { id: 1 },
    ip: "127.0.0.1",
  };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
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
});
