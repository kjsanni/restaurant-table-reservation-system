const { checkPastDue } = require("../../tenant-platform/services/tenantSubscription.service");
const { client } = require("../../utils/cache");

const CRON_LOCK_KEY = "tenant:cron:lock";
const CRON_LOCK_TTL = 300;

const runTenantCron = async () => {
  if (process.env.TENANT_MODE !== "enabled") {
    return;
  }

  let lockAcquired = false;
  try {
    if (client && client.isReady) {
      const result = await client.set(CRON_LOCK_KEY, "1", {
        EX: CRON_LOCK_TTL,
        NX: true,
      });
      lockAcquired = result === "OK";
    }

    if (!lockAcquired) {
      return;
    }

    const suspendedCount = await checkPastDue();
    if (suspendedCount > 0) {
      console.log(`[TenantCron] Suspended ${suspendedCount} past-due tenants`);
    }
  } catch (err) {
    console.error("[TenantCron] Error:", err.message);
  } finally {
    if (lockAcquired && client && client.isReady) {
      try {
        await client.del(CRON_LOCK_KEY);
      } catch (err) {
        console.error("[TenantCron] Lock release error:", err.message);
      }
    }
  }
};

module.exports = { runTenantCron };
