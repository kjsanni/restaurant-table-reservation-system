jest.mock("../DAOs/auth.dao", () => ({
  getAllSettings: jest.fn(),
  getPlatformSettingByKey: jest.fn(),
  updatePlatformSetting: jest.fn(),
  getSettingByKey: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/platformAudit.dao", () => ({
  log: jest.fn(),
}));

const authDAO = require("../DAOs/auth.dao");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");
const { createRes } = require("./utils/test-response");

function createReq(user = { id: 1, isSuperAdmin: true }, body = {}) {
  return { user, body, ip: "127.0.0.1" };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ERPNext connector settings migration", () => {
  describe("platformSettings.controller allowlist", () => {
    it("accepts erpnext_base_url in integrations domain", async () => {
      authDAO.updatePlatformSetting.mockResolvedValue({
        key: "erpnext_base_url",
        value: "https://erp.example.com",
      });

      const req = createReq({ id: 1, isSuperAdmin: true }, { key: "erpnext_base_url", value: "https://erp.example.com" });
      const res = createRes();

      const { updatePlatformSettingHandler } = require("../tenant-platform/controllers/platformSettings.controller");
      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(authDAO.updatePlatformSetting).toHaveBeenCalledWith("erpnext_base_url", "https://erp.example.com");
      expect(platformAuditDAO.log).toHaveBeenCalled();
    });

    it("accepts erpnext_api_key in integrations domain", async () => {
      authDAO.updatePlatformSetting.mockResolvedValue({
        key: "erpnext_api_key",
        value: "test_key",
      });

      const req = createReq({ id: 1, isSuperAdmin: true }, { key: "erpnext_api_key", value: "test_key" });
      const res = createRes();

      const { updatePlatformSettingHandler } = require("../tenant-platform/controllers/platformSettings.controller");
      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("accepts erpnext_api_secret in integrations domain", async () => {
      authDAO.updatePlatformSetting.mockResolvedValue({
        key: "erpnext_api_secret",
        value: "test_secret",
      });

      const req = createReq({ id: 1, isSuperAdmin: true }, { key: "erpnext_api_secret", value: "test_secret" });
      const res = createRes();

      const { updatePlatformSettingHandler } = require("../tenant-platform/controllers/platformSettings.controller");
      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("accepts erpnext_timeout_ms in integrations domain", async () => {
      authDAO.updatePlatformSetting.mockResolvedValue({
        key: "erpnext_timeout_ms",
        value: 45000,
      });

      const req = createReq({ id: 1, isSuperAdmin: true }, { key: "erpnext_timeout_ms", value: 45000 });
      const res = createRes();

      const { updatePlatformSettingHandler } = require("../tenant-platform/controllers/platformSettings.controller");
      await updatePlatformSettingHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("listPlatformSettingsHandler ERPNext redaction", () => {
    it("redacts erpnext_api_key and erpnext_api_secret in response", async () => {
      authDAO.getAllSettings.mockResolvedValue([
        { key: "erpnext_base_url", value: "https://erp.example.com", tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
        { key: "erpnext_api_key", value: "[REDACTED]", tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
        { key: "erpnext_api_secret", value: "[REDACTED]", tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
        { key: "erpnext_timeout_ms", value: 30000, tenantId: null, updatedAt: "2026-01-01T00:00:00Z" },
      ]);

      const req = createReq();
      const res = createRes();

      const { listPlatformSettingsHandler } = require("../tenant-platform/controllers/platformSettings.controller");
      await listPlatformSettingsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      const integrations = response.domains.integrations;

      const apiKeySetting = integrations.find((s) => s.key === "erpnext_api_key");
      const apiSecretSetting = integrations.find((s) => s.key === "erpnext_api_secret");

      expect(apiKeySetting.value).toBe("[REDACTED]");
      expect(apiSecretSetting.value).toBe("[REDACTED]");

      const baseUrlSetting = integrations.find((s) => s.key === "erpnext_base_url");
      expect(baseUrlSetting.value).toBe("https://erp.example.com");
    });
  });
});
