jest.mock("../src/tenant-platform/DAOs/tenantAdmin.dao");

const tenantAdminController = require("../src/tenant-platform/controllers/tenantAdmin.controller");
const tenantAdminDAO = require("../src/tenant-platform/DAOs/tenantAdmin.dao");

jest.mock("../src/db/models", () => ({
  sequelize: {
    connectionManager: { pool: { size: 10, available: 8, waiting: 0 } },
    query: jest.fn().mockResolvedValue([{ Variable_name: "Slow_queries", Value: "0" }]),
  },
}));

jest.mock("../src/utils/cache", () => ({
  queues: [],
  isRedisAvailable: jest.fn().mockResolvedValue(true),
  getCacheStats: jest.fn(() => ({ hits: 10, misses: 5, gets: 15 })),
}));

jest.mock("../src/queues/queue", () => ({
  queues: [],
  isRedisAvailable: jest.fn().mockResolvedValue(true),
}));

jest.mock("../src/utils/redis", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
  CRON_LOCK_TTL: 300,
}));

const monitoringController = require("../src/tenant-platform/controllers/monitoring.controller");
const redisLock = require("../src/utils/redis");

describe("performance baselines", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getTenantsHandler with pagination returns under 500ms", async () => {
    tenantAdminDAO.list.mockResolvedValue({
      rows: [{ id: 1, name: "Tenant 1" }],
      count: 1,
    });

    const req = {
      query: { page: "1", pageSize: "20" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const start = Date.now();
    await tenantAdminController.getTenantsHandler(req, res);
    const duration = Date.now() - start;

    expect(res.status).toHaveBeenCalledWith(200);
    expect(duration).toBeLessThan(500);
  });

  it("getHealthHandler returns under 200ms", async () => {
    redisLock.acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    redisLock.releaseLock.mockResolvedValue({ released: true });

    const healthReq = {};
    const healthRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

    const start = Date.now();
    await monitoringController.getHealthHandler(healthReq, healthRes);
    const duration = Date.now() - start;

    expect(healthRes.status).toHaveBeenCalledWith(200);
    expect(duration).toBeLessThan(200);
  });
});
