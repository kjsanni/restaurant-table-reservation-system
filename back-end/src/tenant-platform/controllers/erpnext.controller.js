const response = require("../utils/response");

"use strict";

const db = require("../../db/models");
const { validateModuleDependencies, getModuleMetadata, getEnabledModules } = require("../../integrations/erpnext/module-registry");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");
const { enqueueCustomerSync, enqueueInvoiceSync, enqueuePaymentSync, enqueueItemSync, enqueueStockEntrySync, enqueueEmployeeSync, enqueueCrmCustomerSync, enqueueFullSync } = require("../../integrations/erpnext/sync/orchestrator");

const SYNC_TYPES = ["full", "customers", "invoices", "payments", "items", "stock", "employees", "crm"];
const SYNC_MAP = {
  customers: enqueueCustomerSync,
  invoices: enqueueInvoiceSync,
  payments: enqueuePaymentSync,
  items: enqueueItemSync,
  stock: enqueueStockEntrySync,
  employees: enqueueEmployeeSync,
  crm: enqueueCrmCustomerSync,
  full: enqueueFullSync,
};
const DEFAULT_PAGE_LIMIT = 50;

const resolveTenantById = async (id) => {
  return db.tenant.findByPk(id, {
    attributes: ["id", "name", "slug", "plan", "settings", "createdAt"],
    include: [
      {
        model: db.user,
        as: "users",
        attributes: ["id", "username", "email"],
      },
    ],
  });
};

const getErpnextTenantHandler = async (req, res) => {
  const tenant = await resolveTenantById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
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
  const tenant = await resolveTenantById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const { module: moduleFlag } = req.body;

  if (!moduleFlag) {
    return response.badRequest(res, "module is required");
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

await auditLog(req, "erpnext.module_provisioned", "tenant", tenant.id, { module: moduleFlag, moduleName: metadata.name, action: "provision" }, { tenantId: tenant.id });

  res.status(200).json({ success: true, module: moduleFlag, message: `${metadata.name} provisioning started` });
};

const deprovisionErpnextModuleHandler = async (req, res) => {
  const tenant = await resolveTenantById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const { module: moduleFlag } = req.body;

  if (!moduleFlag) {
    return response.badRequest(res, "module is required");
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

  for (const flag of getEnabledModules(featureFlags)) {
    const meta = getModuleMetadata(flag);
    if (meta && meta.dependencies && meta.dependencies.includes(moduleFlag)) {
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

await auditLog(req, "erpnext.module_deprovisioned", "tenant", tenant.id, { module: moduleFlag, moduleName: metadata.name, action: "deprovision" }, { tenantId: tenant.id });

  res.status(200).json({ success: true, module: moduleFlag, message: `${metadata.name} deprovisioned` });
};

const listErpnextTenantsHandler = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || DEFAULT_PAGE_LIMIT;
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").trim().toLowerCase();

  const where = {};
  if (search) {
    where.name = { [db.Sequelize.Op.like]: `%${search}%` };
  }

  const { count, rows } = await db.tenant.findAndCountAll({
    where,
    attributes: ["id", "name", "slug", "plan", "settings", "createdAt"],
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
  const tenant = await resolveTenantById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const { syncType = "full" } = req.body;

  if (!SYNC_TYPES.includes(syncType)) {
    return res.status(400).json({ success: false, message: `Invalid sync type. Must be one of: ${SYNC_TYPES.join(", ")}` });
  }

  const featureFlags = tenant.settings?.featureFlags || {};
  const hasErpnext = Object.keys(featureFlags).some((k) => k.startsWith("erpnext_") && featureFlags[k]);
  if (!hasErpnext) {
    return response.forbidden(res, "No ERPNext modules enabled for this tenant");
  }

  const enqueue = SYNC_MAP[syncType]; // nosemgrep // codacy-suppress dynamic-function-invocation
  const result = await enqueue(tenant.id);

await auditLog(req, "erpnext.sync.triggered", "tenant", tenant.id, { syncType, tenantId: tenant.id }, { tenantId: tenant.id });

  res.status(200).json({ success: true, message: `ERPNext ${syncType} sync enqueued`, enqueued: result.enqueued });
};

const getSyncStatusHandler = async (req, res) => {
  const tenant = await resolveTenantById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
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