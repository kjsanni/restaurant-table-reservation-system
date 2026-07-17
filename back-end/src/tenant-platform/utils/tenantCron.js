const { checkPastDue } = require("../../tenant-platform/services/tenantSubscription.service");

const runTenantCron = async () => {
  if (process.env.TENANT_MODE !== "enabled") {
    return;
  }

  try {
    const suspendedCount = await checkPastDue();
    if (suspendedCount > 0) {
      console.log(`[TenantCron] Suspended ${suspendedCount} past-due tenants`);
    }
  } catch (err) {
    console.error("[TenantCron] Error:", err.message);
  }
};

module.exports = { runTenantCron };
