const { tenantCache } = require("../../src/utils/tenantCache");
const { resetCacheStats } = require("../../src/utils/cache");

jest.mock("../../src/utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  getCacheStats: jest.fn(() => ({ hits: 10, misses: 5, gets: 15 })),
  resetCacheStats: jest.fn(),
  getConnectionStatus: jest.fn(() => true),
}));

describe("tenantCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCacheStats();
  });

  describe("get/set/del", () => {
    it("prefixes keys with tenant id", async () => {
      const { cache } = require("../../src/utils/cache");
      cache.get.mockResolvedValue(null);
      cache.set.mockResolvedValue(undefined);

      await tenantCache.set(42, "settings", { theme: "dark" }, 120);
      await tenantCache.get(42, "settings");

      expect(cache.set).toHaveBeenCalledWith("tenant:42:settings", { theme: "dark" }, 120);
      expect(cache.get).toHaveBeenCalledWith("tenant:42:settings");
    });

    it("uses raw tenant id in prefix", async () => {
      const { cache } = require("../../src/utils/cache");
      cache.del.mockResolvedValue(undefined);

      await tenantCache.del(null, "schedules:all");

      expect(cache.del).toHaveBeenCalledWith("tenant:null:schedules:all");
    });

    it("deletes tenant-prefixed keys", async () => {
      const { cache } = require("../../src/utils/cache");
      cache.del.mockResolvedValue(undefined);

      await tenantCache.del(7, "appointments");

      expect(cache.del).toHaveBeenCalledWith("tenant:7:appointments");
    });
  });

  describe("invalidatePattern", () => {
    it("calls cache.del with prefixed pattern", async () => {
      const { cache } = require("../../src/utils/cache");
      cache.del.mockResolvedValue(undefined);

      await tenantCache.invalidatePattern(5, "reservations:*");

      expect(cache.del).toHaveBeenCalledWith("tenant:5:reservations:*");
    });

    it("skips when tenantId is missing", async () => {
      const { cache } = require("../../src/utils/cache");

      await tenantCache.invalidatePattern(null, "reservations:*");

      expect(cache.del).not.toHaveBeenCalled();
    });
  });

  describe("getStats/resetStats", () => {
    it("delegates to underlying cache stats", () => {
      const { getCacheStats, resetCacheStats } = require("../../src/utils/cache");

      tenantCache.getStats();
      expect(getCacheStats).toHaveBeenCalled();

      tenantCache.resetStats();
      expect(resetCacheStats).toHaveBeenCalled();
    });
  });
});
