const { checkPastDue } = require("../../tenant-platform/services/tenantSubscription.service");
const redisLock = require("../../utils/redis");

const CRON_LOCK_KEY = "tenant:cron:lock";

const runTenantCron = async () => {
  const lockResult = await redisLock.acquireLock(CRON_LOCK_KEY, redisLock.CRON_LOCK_TTL);

  if (!lockResult.acquired) {
    console.log(`[TenantCron] Skipped: ${lockResult.reason}`);
    return;
  }

  console.log("[TenantCron] Lock acquired, running suspension check");

  try {
    const suspendedCount = await checkPastDue();
    if (suspendedCount > 0) {
      console.log(`[TenantCron] Suspended ${suspendedCount} past-due tenants`);
    }
  } catch (err) {
    console.error("[TenantCron] Error:", err.message);
  } finally {
    const releaseResult = await redisLock.releaseLock(CRON_LOCK_KEY);
    if (!releaseResult.released) {
      console.error("[TenantCron] Lock release failed:", releaseResult.reason);
    }
  }
};

module.exports = { runTenantCron };
