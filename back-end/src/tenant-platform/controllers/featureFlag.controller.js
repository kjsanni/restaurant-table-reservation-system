const response = require("../utils/response");

const db = require("../../db/models");
const { validateModuleDependencies } = require("../../integrations/erpnext/module-registry");
const { getPlansCached } = require("../services/tenantSubscription.service");

const listFeatureFlagsHandler = async (req, res) => {
  const { FLAG_CATEGORIES, ALL_FEATURE_FLAGS } = require("../services/tenantTypeDefaults.service");
  const flags = ALL_FEATURE_FLAGS.map((flag) => {
    const categoryEntry = Object.entries(FLAG_CATEGORIES).find(([_, category]) => category.flags[flag]);
    const category = categoryEntry?.[1];
    const metadata = category?.flags[flag] || {};
    return {
      flag,
      category: category?.label || "Platform",
      label: metadata.label || flag,
      description: metadata.description || "",
      dependencies: metadata.dependencies || [],
    };
  });
  res.status(200).json({ success: true, flags });
};

const getTenantFeatureFlagsHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id, {
    attributes: ["id", "name", "settings"],
  });
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const featureFlags = tenant.settings?.featureFlags || {};
  res.status(200).json({ success: true, featureFlags });
};

const updateTenantFeatureFlagsHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
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
    return response.notFound(res, "Tenant not found");
  }
  const enabled = req.body.enabled !== false;
  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), salon_module_enabled: enabled };
  await tenant.update({ settings, businessVertical: enabled ? "salon" : "restaurant" });
  res.status(200).json({ success: true, featureFlags: settings.featureFlags });
};

const getFlagAuditLogHandler = async (req, res) => {
  const tenantId = req.params.id;
  const logs = await db.auditLog.findAll({
    where: {
      entityType: "feature_flag",
      entityId: tenantId,
    },
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
  res.status(200).json({ success: true, logs });
};

const bulkCategoryActionHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const { category, action } = req.body || {};
  const validCategories = Object.keys(require("../services/tenantTypeDefaults.service").FLAG_CATEGORIES);
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, message: `Invalid category: ${category}` });
  }
  if (!["enable", "disable"].includes(action)) {
    return response.badRequest(res, 'Action must be "enable" or "disable"');
  }

  const { FLAG_CATEGORIES } = require("../services/tenantTypeDefaults.service");
  const flags = FLAG_CATEGORIES[category].flags;
  const value = action === "enable";
  const updates = {};
  for (const flag of Object.keys(flags)) {
    updates[flag] = value;
  }

  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), ...updates };
  await tenant.update({ settings });
  res.status(200).json({ success: true, featureFlags: settings.featureFlags });
};

const resetTenantFlagsHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const { applyTypeDefaults } = require("../services/tenantTypeDefaults.service");
  const restaurantType = tenant.restaurantType || "full_service";
  const updated = applyTypeDefaults(tenant, restaurantType);
  await tenant.update({ settings: updated.settings, serviceModes: updated.serviceModes, restaurantType: updated.restaurantType });
  res.status(200).json({ success: true, featureFlags: updated.settings.featureFlags });
};

const createFlagPresetHandler = async (req, res) => {
  const { name, featureFlags, description, isPublic } = req.body || {};
  if (!name || !featureFlags) {
    return response.badRequest(res, "Name and featureFlags are required");
  }

  const preset = await db.featureFlagPreset.create({
    name,
    description: description || "",
    featureFlags,
    isPublic: !!isPublic,
    createdBy: req.user?.id || null,
  });
  res.status(201).json({ success: true, preset });
};

const listFlagPresetsHandler = async (req, res) => {
  const presets = await db.featureFlagPreset.findAll({
    where: { isPublic: true },
    order: [["createdAt", "DESC"]],
  });
  res.status(200).json({ success: true, presets });
};

const applyFlagPresetHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const preset = await db.featureFlagPreset.findByPk(req.params.presetId);
  if (!preset) {
    return response.notFound(res, "Preset not found");
  }

  const settings = tenant.settings || {};
  settings.featureFlags = { ...(settings.featureFlags || {}), ...preset.featureFlags };
  await tenant.update({ settings });
  res.status(200).json({ success: true, featureFlags: settings.featureFlags });
};

module.exports = {
  listFeatureFlagsHandler,
  getTenantFeatureFlagsHandler,
  updateTenantFeatureFlagsHandler,
  getGlobalFeatureFlagsHandler,
  updateGlobalFeatureFlagsHandler,
  toggleSalonModuleHandler,
  getFlagAuditLogHandler,
  bulkCategoryActionHandler,
  resetTenantFlagsHandler,
  createFlagPresetHandler,
  listFlagPresetsHandler,
  applyFlagPresetHandler,
};
