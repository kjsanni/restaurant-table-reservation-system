const syncService = require("../services/sync.service");

jest.mock("../DAOs/auth.dao");
const authDAO = require("../DAOs/auth.dao");

describe("syncService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("isSyncEnabled returns false when setting is disabled", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: false, posApiUrl: "", posApiKey: "" });

    const result = await syncService.isSyncEnabled("tenant-1");
    expect(result).toBe(false);
  });

  it("isSyncEnabled returns false when URL is missing", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: true, posApiUrl: "", posApiKey: "abc" });

    const result = await syncService.isSyncEnabled("tenant-1");
    expect(result).toBe(false);
  });

  it("isSyncEnabled returns false when API key is missing", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: true, posApiUrl: "http://pos", posApiKey: "" });

    const result = await syncService.isSyncEnabled("tenant-1");
    expect(result).toBe(false);
  });

  it("isSyncEnabled returns true when all config is present", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: true, posApiUrl: "http://pos", posApiKey: "abc" });

    const result = await syncService.isSyncEnabled("tenant-1");
    expect(result).toBe(true);
  });

  it("getSyncConfig returns default when setting is missing", async () => {
    authDAO.getSettingValue.mockResolvedValue(null);

    const result = await syncService.getSyncConfig("tenant-1");
    expect(result).toEqual({ enabled: false, posApiUrl: "", posApiKey: "" });
  });

  it("getSyncConfig returns stored value when present", async () => {
    authDAO.getSettingValue.mockResolvedValue({ enabled: true, posApiUrl: "http://pos", posApiKey: "abc" });

    const result = await syncService.getSyncConfig("tenant-1");
    expect(result).toEqual({ enabled: true, posApiUrl: "http://pos", posApiKey: "abc" });
  });
});
