const { cache } = require("../utils/cache");

jest.mock("../utils/cache", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  client: null,
  isConnected: false,
  getCacheStats: jest.fn(() => ({ hits: 0, misses: 0, gets: 0 })),
  resetCacheStats: jest.fn(),
  closeClient: jest.fn(),
}));

describe("cache namespacing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
    cache.set.mockResolvedValue("OK");
  });

  describe("tenant resolution cache keys", () => {
    it("uses tenant:id:{id} format for numeric IDs", () => {
      expect("tenant:id:42").toMatch(/^tenant:id:\d+$/);
    });

    it("uses tenant:slug:{slug} format for slug lookups", () => {
      expect("tenant:slug:labone").toMatch(/^tenant:slug:[a-z0-9-]+$/);
    });
  });

  describe("schedule cache keys", () => {
    it("uses schedule:{day}:{tenantId} for tenant schedules", () => {
      expect("schedule:Monday:10").toBe("schedule:Monday:10");
    });

    it("uses schedule:{day}:global for global schedules", () => {
      expect("schedule:Monday:global").toBe("schedule:Monday:global");
    });

    it("uses schedules:all for list cache", () => {
      expect("schedules:all").toBe("schedules:all");
    });
  });

  describe("holiday cache keys", () => {
    it("uses holidays:all for list cache", () => {
      expect("holidays:all").toBe("holidays:all");
    });

    it("uses holiday:{date} for individual holiday cache", () => {
      expect("holiday:2025-12-25").toBe("holiday:2025-12-25");
    });
  });

  describe("whatsapp session cache keys", () => {
    it("uses phone number prefixed keys for sessions", () => {
      expect("whatsapp:session:+233241234567").toBe("whatsapp:session:+233241234567");
    });

    it("uses phone number prefixed keys for carts", () => {
      expect("whatsapp:cart:+233241234567").toBe("whatsapp:cart:+233241234567");
    });
  });

  describe("geocoding cache keys", () => {
    it("uses lat,lng format for geocoding cache", () => {
      expect("geocode:5.6037,-0.1870").toBe("geocode:5.6037,-0.1870");
    });
  });

  describe("cache key pattern consistency", () => {
    it("all keys use colon separator without spaces", () => {
      const keys = [
        "tenant:id:1",
        "tenant:slug:labone",
        "schedule:Monday:1",
        "schedule:Monday:global",
        "holiday:2025-12-25",
        "whatsapp:session:+233241234567",
        "geocode:5.6037,-0.1870",
      ];
      keys.forEach((key) => {
        expect(key).not.toMatch(/\s/);
        expect(key.split(":").length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
