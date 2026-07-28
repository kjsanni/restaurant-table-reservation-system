const {
  listPlatformSettingsHandler,
  updatePlatformSettingHandler,
} = require("../tenant-platform/controllers/platformSettings.controller");

jest.mock("../DAOs/auth.dao", () => ({
  getAllSettings: jest.fn(),
  getPlatformSettingByKey: jest.fn(),
  updatePlatformSetting: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const authDAO = require("../DAOs/auth.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

function createReq(user = { id: 1 }, body = {}) {
  return { user, body, ip: "127.0.0.1" };
}

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("platformSettings.controller", () => {
  describe("listPlatformSettingsHandler", () => {
    it("returns platform settings grouped by domain", async () => {
      authDAO.getAllSettings.mockResolvedValue([
        { key: "password_policy", value: { minLength: 12 }, tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
        { key: "maintenance_mode", value: false, tenantId: null, updatedAt: "2026-01-02T00:00:00Z" },
        { key: "feature_flags", value: { salon: true }, tenantId: null, updatedAt: "2026-01-03T00:00:00Z" },
      ]);

      const req = createReq();
      const res = createRes();

      await listPlatformSettingsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          domains: expect.objectContaining({
            security: expect.any(Array),
            operations: expect.any(Array),
            features: expect.any(Array),
          }),
        })
      );
      expect(authDAO.getAllSettings).toHaveBeenCalledWith(null);
    });

    it("filters to platform-scoped settings only (tenantId === null)", async () => {
      authDAO.getAllSettings.mockResolvedValue([
        { key: "password_policy", value: { minLength: 12 }, tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
        { key: "tenant_name", value: "Acme", tenantId: 5, updatedAt: "2026-01-02T00:00:00Z" },
      ]);

      const req = createReq();
      const res = createRes();

      await listPlatformSettingsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          domains: expect.objectContaining({
            security: expect.arrayContaining([
              expect.objectContaining({ key: "password_policy" }),
            ]),
          }),
        })
      );
    });

    it("returns empty domains when no settings exist", async () => {
      authDAO.getAllSettings.mockResolvedValue([]);

      const req = createReq();
      const res = createRes();

      await listPlatformSettingsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, domains: {} });
    });
  });

  describe("updatePlatformSettingHandler", () => {
    it("updates allowed setting and logs audit", async () => {
      authDAO.getPlatformSettingByKey.mockResolvedValue({ key: "maintenance_mode", value: false });
      authDAO.updatePlatformSetting.mockResolvedValue({ key: "maintenance_mode", value: true });

      const req = createReq({ id: 1 }, { key: "maintenance_mode", value: true });
      const res = createRes();

      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(authDAO.updatePlatformSetting).toHaveBeenCalledWith("maintenance_mode", true);
      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "platform_setting.updated",
        "platform_setting",
        "maintenance_mode",
        null,
        expect.objectContaining({
          key: "maintenance_mode",
          previousValue: false,
          newValue: true,
        }),
        "127.0.0.1"
      );
    });

    it("rejects non-allowlisted setting keys", async () => {
      const req = createReq({ id: 1 }, { key: "tenant_name", value: "Evil" });
      const res = createRes();

      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Unknown or protected setting key." })
      );
      expect(authDAO.updatePlatformSetting).not.toHaveBeenCalled();
    });

    it("handles missing previous value when setting does not exist yet", async () => {
      authDAO.getPlatformSettingByKey.mockResolvedValue(null);
      authDAO.updatePlatformSetting.mockResolvedValue({ key: "brute_force_threshold", value: 5 });

      const req = createReq({ id: 1 }, { key: "brute_force_threshold", value: 5 });
      const res = createRes();

      await updatePlatformSettingHandler(req, res);

      expect(platformAuditDAO.log).toHaveBeenCalledWith(
        1,
        "platform_setting.updated",
        "platform_setting",
        "brute_force_threshold",
        null,
        expect.objectContaining({
          key: "brute_force_threshold",
          newValue: 5,
          previousValue: undefined,
        }),
        "127.0.0.1"
      );
    });
  });
});
