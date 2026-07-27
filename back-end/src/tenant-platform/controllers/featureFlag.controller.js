const db = require("../../db/models");

const listFeatureFlagsHandler = async (req, res) => {
  const flags = Object.keys(
    require("../services/tenantTypeDefaults.service").TYPE_DEFAULTS.full_service.featureFlags
  );
  res.status(200).json({ success: true, flags });
};

const getTenantFeatureFlagsHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id, {
    attributes: ["id", "name", "settings"],
  });
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const featureFlags = tenant.settings?.featureFlags || {};
  res.status(200).json({ success: true, featureFlags });
};

const updateTenantFeatureFlagsHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const featureFlags = req.body.featureFlags || {};
  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), ...featureFlags };
  await tenant.update({ settings });
  res.status(200).json({ success: true, featureFlags: settings.featureFlags });
};

const getGlobalFeatureFlagsHandler = async (req, res) => {
  const setting = await db.setting.findOne({ where: { key: "global_feature_flags" } });
  const flags = setting?.value || {};
  res.status(200).json({ success: true, flags });
};

const updateGlobalFeatureFlagsHandler = async (req, res) => {
  const flags = req.body.flags || {};
  const { updateSetting } = require("../../DAOs/auth.dao");
  await updateSetting("global_feature_flags", flags, null);
  res.status(200).json({ success: true, flags });
};

const toggleSalonModuleHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const enabled = req.body.enabled !== false;
  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), salon_module_enabled: enabled };
  await tenant.update({ settings, businessVertical: enabled ? "salon" : "restaurant" });
  res.status(200).json({ success: true, featureFlags: settings.featureFlags });
};

module.exports = {
  listFeatureFlagsHandler,
  getTenantFeatureFlagsHandler,
  updateTenantFeatureFlagsHandler,
  getGlobalFeatureFlagsHandler,
  updateGlobalFeatureFlagsHandler,
  toggleSalonModuleHandler,
};
