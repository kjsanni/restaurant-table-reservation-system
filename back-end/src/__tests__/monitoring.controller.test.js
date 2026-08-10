const monitoringController = require("../tenant-platform/controllers/monitoring.controller");
const redisLock = require("../utils/redis");

jest.mock("../db/models");
jest.mock("../utils/cache", () => ({
  queues: [],
  isRedisAvailable: jest.fn().mockResolvedValue(true),
  getCacheStats: jest.fn(() => ({ hits: 10, misses: 5, gets: 15 })),
}));
jest.mock("../queues/queue", () => ({
  queues: [],
  isRedisAvailable: jest.fn().mockResolvedValue(true),
}));
jest.mock("../utils/redis", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
  CRON_LOCK_TTL: 300,
}));

describe("monitoring.controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("getQueueStatsHandler returns queue stats", async () => {
    const queueModule = require("../queues/queue");
    queueModule.queues = [
      {
        name: "notifications",
        getJobCounts: jest.fn().mockResolvedValue({ waiting: 1, active: 0, failed: 0, completed: 5, delayed: 0 }),
        getFailedJobs: jest.fn().mockResolvedValue([]),
      },
    ];

    await monitoringController.getQueueStatsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, redisAvailable: true }));
  });

  it("getDatabaseStatsHandler returns database stats", async () => {
    const db = require("../db/models");
    db.sequelize = {
      connectionManager: { pool: { size: 10, available: 8, waiting: 0 } },
      query: jest.fn().mockResolvedValue([{ Variable_name: "Slow_queries", Value: "0" }]),
    };

    await monitoringController.getDatabaseStatsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("getErrorRateHandler returns error stats", async () => {
    const fs = require("fs");
    jest.spyOn(fs, "existsSync").mockReturnValue(false);

    await monitoringController.getErrorRateHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 0 }));
  });

  it("getIntegrationLatencyHandler returns latency data", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );

    await monitoringController.getIntegrationLatencyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("getHealthHandler includes cron lock status", async () => {
    redisLock.acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    redisLock.releaseLock.mockResolvedValue({ released: true });

    const healthReq = {};
    const healthRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const db = require("../db/models");
    db.sequelize = {
      connectionManager: { pool: { size: 10, available: 8, waiting: 0 } },
      query: jest.fn().mockResolvedValue([{ Variable_name: "Slow_queries", Value: "0" }]),
    };

    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

    await monitoringController.getHealthHandler(healthReq, healthRes);
    expect(healthRes.status).toHaveBeenCalledWith(200);
    const responseArg = healthRes.json.mock.calls[healthRes.json.mock.calls.length - 1][0];
    expect(responseArg.success).toBe(true);
    expect(responseArg.cron).toEqual({
      lockAvailable: true,
      lockReason: "acquired",
    });
  });
});
