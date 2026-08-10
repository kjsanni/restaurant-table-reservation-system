const { runTenantCron } = require("../../src/tenant-platform/utils/tenantCron");
const redisLock = require("../../src/utils/redis");

jest.mock("../../src/tenant-platform/services/tenantSubscription.service", () => ({
  checkPastDue: jest.fn(),
}));

jest.mock("../../src/utils/redis", () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
  CRON_LOCK_TTL: 300,
}));

describe("runTenantCron", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it("skips execution when lock is not acquired", async () => {
    redisLock.acquireLock.mockResolvedValue({ acquired: false, reason: "already_held" });

    await runTenantCron();

    expect(redisLock.acquireLock).toHaveBeenCalledWith("tenant:cron:lock", 300);
    expect(redisLock.releaseLock).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith("[TenantCron] Skipped: already_held");
  });

  it("runs suspension check when lock is acquired and releases lock", async () => {
    const { checkPastDue } = require("../../src/tenant-platform/services/tenantSubscription.service");
    checkPastDue.mockResolvedValue(2);

    redisLock.acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    redisLock.releaseLock.mockResolvedValue({ released: true });

    await runTenantCron();

    expect(checkPastDue).toHaveBeenCalled();
    expect(redisLock.releaseLock).toHaveBeenCalledWith("tenant:cron:lock");
    expect(console.log).toHaveBeenCalledWith("[TenantCron] Lock acquired, running suspension check");
    expect(console.log).toHaveBeenCalledWith("[TenantCron] Suspended 2 past-due tenants");
  });

  it("logs error when lock release fails", async () => {
    redisLock.acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    redisLock.releaseLock.mockResolvedValue({ released: false, reason: "redis_down" });

    await runTenantCron();

    expect(console.error).toHaveBeenCalledWith("[TenantCron] Lock release failed:", "redis_down");
  });

  it("handles checkPastDue errors gracefully", async () => {
    const { checkPastDue } = require("../../src/tenant-platform/services/tenantSubscription.service");
    checkPastDue.mockRejectedValue(new Error("DB error"));

    redisLock.acquireLock.mockResolvedValue({ acquired: true, reason: "acquired" });
    redisLock.releaseLock.mockResolvedValue({ released: true });

    await runTenantCron();

    expect(console.error).toHaveBeenCalledWith("[TenantCron] Error:", "DB error");
    expect(redisLock.releaseLock).toHaveBeenCalled();
  });
});
