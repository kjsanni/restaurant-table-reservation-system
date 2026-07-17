const db = require("../../db/models");

let cachedEnabled = null;
let cachedAt = 0;

const isTenantModeEnabled = async () => {
  const now = Date.now();
  if (cachedEnabled !== null && now - cachedAt < 60000) return cachedEnabled;

  if (process.env.TENANT_MODE !== "enabled") {
    cachedEnabled = false;
    cachedAt = now;
    return false;
  }

  let enabled = false;
  try {
    const setting = await db.setting.findOne({ where: { key: "tenant_mode_enabled" } });
    if (setting) {
      const value =
        typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value;
      enabled = Boolean(value);
    }
  } catch {
    enabled = false;
  }

  cachedEnabled = enabled;
  cachedAt = now;
  return enabled;
};

const resetTenantModeCache = () => {
  cachedEnabled = null;
  cachedAt = 0;
};

module.exports = { isTenantModeEnabled, resetTenantModeCache };
