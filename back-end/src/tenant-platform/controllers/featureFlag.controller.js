const db = require("../../db/models");
const { validateModuleDependencies } = require("../../integrations/erpnext/module-registry");
const { getPlansCached } = require("../services/tenantSubscription.service");

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
  const sanitizedFeatureFlags = Object.fromEntries(
    Object.entries(featureFlags).filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key))
  );
  const erpnextFlags = Object.keys(sanitizedFeatureFlags).filter((k) => k.startsWith("erpnext_"));

  if (erpnextFlags.length > 0) {
    const plans = await getPlansCached();
    const plan = plans[tenant.plan] || plans.starter;
    const allowedModules = Array.isArray(plan.erpnextModules) ? plan.erpnextModules : [];

    for (const flag of erpnextFlags) {
      if (featureFlags[flag] && !allowedModules.includes(flag)) {
        return res.status(403).json({
          success: false,
          message: `Plan "${tenant.plan}" does not include ERPNext module "${flag}". Upgrade your plan to enable it.`,
        });
      }
    }

    for (const flag of erpnextFlags) {
      const depCheck = validateModuleDependencies(featureFlags, flag);
      if (!depCheck.valid) {
        return res.status(400).json({
          success: false,
          message: `Module "${flag}" requires dependencies: ${depCheck.missing.join(", ")}`,
        });
      }
    }
  }

  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), ...sanitizedFeatureFlags };
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
