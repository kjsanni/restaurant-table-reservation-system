const db = require("../../db/models");
const { normalizeSettingValue } = require("../../utils/settings");

let cachedEnabled = null;
let cachedAt = 0;

const isTenantModeEnabled = async () => {
  const now = Date.now();
  if (cachedEnabled !== null && now - cachedAt < 60000) return cachedEnabled;

  let enabled = false;
  try {
    const setting = await db.setting.findOne({ where: { key: "tenant_mode_enabled" } });
    if (setting) {
      const value = normalizeSettingValue(setting.value);
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
