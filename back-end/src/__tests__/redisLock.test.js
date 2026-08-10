const redisLock = require("../../src/utils/redis");

jest.mock("../../src/utils/cache", () => ({
  client: {
    set: jest.fn(),
    del: jest.fn(),
    isReady: true,
  },
  isRedisAvailable: jest.fn(() => true),
  getConnectionStatus: jest.fn(() => true),
}));

describe("redis lock helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const cache = require("../../src/utils/cache");
    cache.client.set.mockReset();
    cache.client.del.mockReset();
    cache.isRedisAvailable.mockReturnValue(true);
    cache.getConnectionStatus.mockReturnValue(true);
  });

  describe("acquireLock", () => {
    it("returns acquired=true when Redis SET NX succeeds", async () => {
      const { client } = require("../../src/utils/cache");
      client.set.mockResolvedValue("OK");

      const result = await redisLock.acquireLock("test-key", 60);

      expect(result.acquired).toBe(true);
      expect(result.reason).toBe("acquired");
      expect(client.set).toHaveBeenCalledWith("test-key", "1", {
        EX: 60,
        NX: true,
      });
    });

    it("returns acquired=false when Redis SET NX returns null", async () => {
      const { client } = require("../../src/utils/cache");
      client.set.mockResolvedValue(null);

      const result = await redisLock.acquireLock("test-key", 60);

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe("already_held");
    });

    it("returns acquired=false when Redis is unavailable", async () => {
      const cache = require("../../src/utils/cache");
      cache.isRedisAvailable.mockReturnValue(false);
      cache.getConnectionStatus.mockReturnValue(false);

      const result = await redisLock.acquireLock("test-key", 60);

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe("redis_unavailable");
    });

    it("returns acquired=false on Redis error", async () => {
      const { client } = require("../../src/utils/cache");
      client.set.mockRejectedValue(new Error("Redis down"));

      const result = await redisLock.acquireLock("test-key", 60);

      expect(result.acquired).toBe(false);
      expect(result.reason).toBe("error");
      expect(result.error).toBe("Redis down");
    });
  });

  describe("releaseLock", () => {
    it("returns released=true when Redis DEL succeeds", async () => {
      const { client } = require("../../src/utils/cache");
      client.del.mockResolvedValue(1);

      const result = await redisLock.releaseLock("test-key");

      expect(result.released).toBe(true);
      expect(client.del).toHaveBeenCalledWith("test-key");
    });

    it("returns released=false when Redis is unavailable", async () => {
      const cache = require("../../src/utils/cache");
      cache.isRedisAvailable.mockReturnValue(false);
      cache.getConnectionStatus.mockReturnValue(false);

      const result = await redisLock.releaseLock("test-key");

      expect(result.released).toBe(false);
      expect(result.reason).toBe("redis_unavailable");
    });

    it("returns released=false on Redis error", async () => {
      const { client } = require("../../src/utils/cache");
      client.del.mockRejectedValue(new Error("Redis down"));

      const result = await redisLock.releaseLock("test-key");

      expect(result.released).toBe(false);
      expect(result.reason).toBe("error");
    });
  });
});
