"use strict";

const db = require("../../db/models");
const { validateModuleDependencies, getAllModules, getModuleMetadata, getEnabledModules } = require("../../integrations/erpnext/module-registry");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const getErpnextTenantHandler = async (req, res) => {
  const tenant = req.tenant;
  const featureFlags = tenant.settings?.featureFlags || {};
  const erpnextModules = getEnabledModules(featureFlags);
  const onboardingStatus = tenant.settings?.erpnextOnboardingStatus || {};

  res.status(200).json({
    success: true,
    tenantId: tenant.id,
    tenantName: tenant.name,
    erpnextModules,
    onboardingStatus,
    plan: tenant.plan,
  });
};

const provisionErpnextModuleHandler = async (req, res) => {
  const tenant = req.tenant;
  const { module: moduleFlag } = req.body;

  if (!moduleFlag) {
    return res.status(400).json({ success: false, message: "module is required" });
  }

  const metadata = getModuleMetadata(moduleFlag);
  if (!metadata) {
    return res.status(400).json({ success: false, message: `Unknown ERPNext module: ${moduleFlag}` });
  }

  if (req.user?.isSuperAdmin) {
    const featureFlags = tenant.settings?.featureFlags || {};
    if (featureFlags[moduleFlag]) {
      return res.status(200).json({ success: true, message: `${metadata.name} is already enabled`, alreadyEnabled: true });
    }

    const depCheck = validateModuleDependencies(featureFlags, moduleFlag);
    if (!depCheck.valid) {
      return res.status(400).json({
        success: false,
        message: "Missing required dependencies",
        missing: depCheck.missing,
      });
    }
  }

  const featureFlags = tenant.settings?.featureFlags || {};
  featureFlags[moduleFlag] = true;

  await tenant.update({
    settings: { ...tenant.settings, featureFlags },
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "erpnext.module_provisioned",
    "tenant",
    tenant.id,
    tenant.id,
    { module: moduleFlag, moduleName: metadata.name, action: "provision" },
    req.ip
  );

  res.status(200).json({ success: true, module: moduleFlag, message: `${metadata.name} provisioning started` });
};

const deprovisionErpnextModuleHandler = async (req, res) => {
  const tenant = req.tenant;
  const { module: moduleFlag } = req.body;

  if (!moduleFlag) {
    return res.status(400).json({ success: false, message: "module is required" });
  }

  const metadata = getModuleMetadata(moduleFlag);
  if (!metadata) {
    return res.status(400).json({ success: false, message: `Unknown ERPNext module: ${moduleFlag}` });
  }

  const featureFlags = tenant.settings?.featureFlags || {};
  if (!featureFlags[moduleFlag]) {
    return res.status(200).json({ success: true, message: `${metadata.name} is not enabled`, alreadyDisabled: true });
  }

  const allFlags = { ...featureFlags };
  delete allFlags[moduleFlag];

  for (const [flag, meta] of Object.entries(getModuleMetadata || {})) {
    if (allFlags[flag] && meta.dependencies && meta.dependencies.includes(moduleFlag)) {
      return res.status(400).json({
        success: false,
        message: `Cannot disable ${metadata.name}: ${meta.name} depends on it`,
        dependentModule: flag,
      });
    }
  }

  await tenant.update({
    settings: { ...tenant.settings, featureFlags: allFlags },
  });

  await platformAuditDAO.log(
    req.user?.id || null,
    "erpnext.module_deprovisioned",
    "tenant",
    tenant.id,
    tenant.id,
    { module: moduleFlag, moduleName: metadata.name, action: "deprovision" },
    req.ip
  );

  res.status(200).json({ success: true, module: moduleFlag, message: `${metadata.name} deprovisioned` });
};

const listErpnextTenantsHandler = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").trim().toLowerCase();

  const where = {};
  if (search) {
    where.name = { [db.Sequelize.Op.like]: `%${search}%` };
  }

  const { count, rows } = await db.tenant.findAndCountAll({
    where,
    attributes: ["id", "name", "slug", "plan", "settings"],
    include: [
      {
        model: db.user,
        as: "users",
        attributes: ["id", "username", "email"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const results = rows.map((tenant) => {
    const featureFlags = tenant.settings?.featureFlags || {};
    const erpnextModules = getEnabledModules(featureFlags);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      erpnextModules,
      userCount: tenant.users?.length || 0,
    };
  });

  res.status(200).json({ success: true, total: count, page, limit, collection: results });
};

const triggerSyncHandler = async (req, res) => {
  const tenant = req.tenant;
  const { syncType = "full" } = req.body;
  const validTypes = ["full", "customers", "invoices", "payments", "items", "stock", "employees", "crm"];

  if (!validTypes.includes(syncType)) {
    return res.status(400).json({ success: false, message: `Invalid sync type. Must be one of: ${validTypes.join(", ")}` });
  }

  const featureFlags = tenant.settings?.featureFlags || {};
  const hasErpnext = Object.keys(featureFlags).some((k) => k.startsWith("erpnext_") && featureFlags[k]);
  if (!hasErpnext) {
    return res.status(403).json({ success: false, message: "No ERPNext modules enabled for this tenant" });
  }

  const { enqueueFullSync } = require("../../integrations/erpnext/sync/orchestrator");
  const result = await enqueueFullSync(tenant.id);

  await platformAuditDAO.log(
    req.user?.id || null,
    "erpnext.sync.triggered",
    "tenant",
    tenant.id,
    tenant.id,
    { syncType, tenantId: tenant.id },
    req.ip
  );

  res.status(200).json({ success: true, message: `ERPNext ${syncType} sync enqueued`, enqueued: result.enqueued });
};

const getSyncStatusHandler = async (req, res) => {
  const tenant = req.tenant;
  const onboardingStatus = tenant.settings?.erpnextOnboardingStatus || {};
  const lastSync = tenant.settings?.erpnextLastSync || null;

  res.status(200).json({
    success: true,
    tenantId: tenant.id,
    onboardingStatus,
    lastSync,
  });
};

module.exports = {
  getErpnextTenantHandler,
  provisionErpnextModuleHandler,
  deprovisionErpnextModuleHandler,
  listErpnextTenantsHandler,
  triggerSyncHandler,
  getSyncStatusHandler,
};