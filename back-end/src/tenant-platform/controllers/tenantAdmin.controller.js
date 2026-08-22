const response = require("../utils/response");

const db = require("../../db/models");

const tenantAdminDAO = require("../DAOs/tenantAdmin.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const {
  enableTenant,
  disableTenant,
  getTenantDashboard,
} = require("../services/tenantSubscription.service");
const { applyTypeDefaults, seedSalonSettings, seedEventSettings } = require("../services/tenantTypeDefaults.service");
const { enqueueProvisioning } = require("../../queues/provisioning.queue");
const verticalTemplateController = require("./verticalTemplate.controller");
const axios = require("axios");
const { normalizeSettingValue } = require("../../utils/settings");
const auditLog = require("../utils/auditLog");
const { ROLE_HIERARCHY } = require("../../middleware/auth");
const secretEncryption = require("../../utils/secretEncryption");

const createTenantHandler = async (req, res) => {
  const { name, slug, domain, plan, status, billingEmail, billingName, currency, restaurantType, businessVertical, serviceModes, templateId } = req.body;

  if (!name || !slug) {
    return response.badRequest(res, "Name and slug are required");
  }

  const normalizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!normalizedSlug) {
    return response.badRequest(res, "Slug must contain only lowercase letters, numbers, and hyphens");
  }

  const existing = await tenantAdminDAO.findBySlug(normalizedSlug);
  if (existing) {
    return res.status(409).json({ success: false, message: `Slug "${normalizedSlug}" is already in use` });
  }

  let template = null;
  if (templateId) {
    template = await verticalTemplateController.getTemplateById(templateId);
    if (!template) {
      return res.status(400).json({ success: false, message: `Template with id ${templateId} not found` });
    }
  }

  const typeDefaults =
    require("../services/tenantTypeDefaults.service").TYPE_DEFAULTS[
      restaurantType || "full_service"
    ] || require("../services/tenantTypeDefaults.service").TYPE_DEFAULTS.full_service;

  const salonDefaults = require("../services/tenantTypeDefaults.service").TYPE_DEFAULTS.salonDefaults || {};

  const resolvedVertical = template?.defaultSettings?.businessVertical || businessVertical || "restaurant";
  const resolvedRestaurantType = template?.defaultSettings?.restaurantType || restaurantType || (resolvedVertical === "event" ? "event" : "full_service");

  const settings = {
    featureFlags: { ...typeDefaults.featureFlags, ...(template?.featureFlags || {}) },
    ...(resolvedVertical === "salon" ? salonDefaults : {}),
    ...(template?.defaultSettings || {}),
  };

  const resolvedServiceModes =
    Array.isArray(serviceModes) && serviceModes.length > 0
      ? serviceModes
      : template?.defaultServiceModes?.length > 0
      ? template.defaultServiceModes
      : typeDefaults.serviceModes;

  const tenant = await tenantAdminDAO.create({
    name,
    slug: normalizedSlug,
    domain: domain ? String(domain).trim() : null,
    plan: plan || "starter",
    status: status || "active",
    billingEmail,
    billingName,
    currency: currency || "GHS",
    businessVertical: resolvedVertical,
    serviceModes: resolvedServiceModes,
    settings,
    restaurantType: resolvedRestaurantType,
    templateId: template?.id || null,
  });

  if (template) {
    verticalTemplateController
      .recordTemplateUsage({
        templateId: template.id,
        tenantId: tenant.id,
        appliedBy: req.user?.id || null,
        source: "tenant_creation",
      })
      .catch((err) => {
        console.error("Failed to record template usage:", err.message);
      });
  }

  if (resolvedVertical === "salon") {
    seedSalonSettings(tenant.id).catch((err) => {
      console.error("Failed to seed salon settings:", err.message);
    });
  } else if (resolvedVertical === "event") {
    seedEventSettings(tenant.id).catch((err) => {
      console.error("Failed to seed event settings:", err.message);
    });
  }

  try {
    enqueueProvisioning(tenant.id, req.user?.id || null).catch((err) => {
      console.error("Failed to enqueue provisioning:", err.message);
    });
  } catch (provisionErr) {
    console.error("Provisioning failed after admin tenant creation:", provisionErr.message);
  }

  res.status(201).json({ success: true, item: tenant });
};

const getTenantsHandler = async (req, res) => {
  const { status: queryStatus, plan, search, page = 1, pageSize = 20 } = req.query;

  const { rows, count } = await tenantAdminDAO.list({
    queryStatus,
    plan,
    search,
    page,
    pageSize,
  });

  res.status(200).json({
    success: true,
    collection: rows,
    total: count,
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
  });
};

const getTenantHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id, {
    include: [
      {
        model: db.user,
        as: "users",
        attributes: ["id", "username", "email", "role", "createdAt"],
      },
    ],
  });

  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  res.status(200).json({ success: true, item: sanitizeTenant(tenant) });
};

const updateTenantHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const allowed = ["name", "plan", "settings", "billingEmail", "billingName", "currency", "restaurantType", "restaurantSubtype", "serviceModes", "businessVertical", "whatsappConfig", "dataRegion", "residencyNotes", "domain"];
  const updates = {};
  const changes = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      let next = req.body[key];
      if (key === "domain" && next !== null && next !== undefined) {
        next = String(next).trim() || null;
      }
      const prev = tenant[key];
      if (prev !== next) {
        updates[key] = next;
        changes[key] = { from: prev, to: next };
      }
    }
  }

  if (updates.restaurantType && updates.restaurantType !== tenant.restaurantType) {
    applyTypeDefaults(tenant, updates.restaurantType);
    updates.settings = tenant.settings;
    updates.serviceModes = tenant.serviceModes;
  }

  await tenant.update(updates);

  if (Object.keys(changes).length > 0) {
    await auditLog(req, "tenant.updated", "tenant", tenant.id, { changes }, { tenantId: tenant.id });
  }

  res.status(200).json({ success: true, item: sanitizeTenant(tenant) });
};

const deleteTenantHandler = async (req, res) => {
  try {
    const tenant = await tenantAdminDAO.softDelete(req.params.id);
    if (!tenant) {
      return response.notFound(res, "Tenant not found");
    }

    await tenantAdminDAO.log(
      req.user?.id || null,
      "tenant.deleted",
      "tenant",
      tenant.id,
      tenant.id,
      { tenantId: tenant.id, tenantName: tenant.name, tenantSlug: tenant.slug },
      req.ip
    );

    res.status(200).json({ success: true, message: "Tenant deleted successfully", item: tenant });
  } catch (err) {
    if (err.isAlreadyDeleted) {
      return response.badRequest(res, "Tenant is already deleted");
    }
    throw err;
  }
};

const enableTenantHandler = async (req, res) => {
  try {
    const tenant = await enableTenant(req.params.id);
    res.status(200).json({ success: true, item: tenant });
  } catch (err) {
    response.notFound(res, err.message);
  }
};

const disableTenantHandler = async (req, res) => {
  const { reason } = req.body;
  try {
    const tenant = await disableTenant(req.params.id, reason);
    res.status(200).json({ success: true, item: tenant });
  } catch (err) {
    response.notFound(res, err.message);
  }
};

const exportTenantDataHandler = async (req, res) => {
  const exported = await tenantAdminDAO.export(req.params.id);
  if (!exported) {
    return response.notFound(res, "Tenant not found");
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    tenant: sanitizeTenant(exported.tenant),
    settings: exported.settings.map((s) => ({ key: s.key, value: s.value, updatedAt: s.updatedAt })),
    notes: exported.notes,
    legalAcceptances: exported.legalAcceptances,
  };

  res.status(200).json({ success: true, data: payload });
};

const exportSelfTenantDataHandler = async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return response.badRequest(res, "Tenant context is required");
  }

  const exported = await tenantAdminDAO.export(tenantId);
  if (!exported) {
    return response.notFound(res, "Tenant not found");
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    tenant: sanitizeTenant(exported.tenant),
    settings: exported.settings.map((s) => ({ key: s.key, value: s.value, updatedAt: s.updatedAt })),
    notes: exported.notes,
    legalAcceptances: exported.legalAcceptances,
  };

  res.status(200).json({ success: true, data: payload });
};

const getDashboardHandler = async (req, res) => {
  const dashboard = await getTenantDashboard();
  res.status(200).json({ success: true, ...dashboard });
};

const SENSITIVE_FIELDS = [
  "paystackSecretKey",
  "shaqexpressSecret",
  "secret",
  "webhookSecret",
  "previousSecretKey",
];

const sanitizeTenant = (tenant) => {
  const obj = tenant.toJSON ? tenant.toJSON() : { ...tenant };
  for (const f of SENSITIVE_FIELDS) {
    if (obj[f] !== undefined && obj[f] !== null) {
      const decrypted = secretEncryption.decrypt(obj[f]);
      const str = String(decrypted);
      obj[f] = str.slice(-4).padStart(str.length, "*");
    }
  }
  if (obj.settings) {
    const cfg = normalizeSettingValue(obj.settings);
    if (cfg.shaqexpress_config) {
      if (cfg.shaqexpress_config.secret) {
        const decrypted = secretEncryption.decrypt(cfg.shaqexpress_config.secret);
        const s = String(decrypted);
        cfg.shaqexpress_config.secret = s
          .slice(-4)
          .padStart(s.length, "*");
      }
    }
    obj.settings = cfg;
  }
  return obj;
};

const testPaystackHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const userRoles = Array.isArray(req.user?.platformRoles) ? req.user.platformRoles : [];
  const userMaxLevel = Math.max(0, ...userRoles.map((r) => ROLE_HIERARCHY[r] || 0));
  const isAuthorized =
    req.user?.isSuperAdmin === true ||
    userMaxLevel >= ROLE_HIERARCHY.platform_technical ||
    req.user?.permissions?.manage_billing === true;
  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { publicKey, secretKey } = req.body;
  if (!publicKey || !secretKey) {
    return res
      .status(400)
      .json({ success: false, message: "Public key and secret key are required" });
  }
  if (!secretKey.startsWith("sk_")) {
    return res
      .status(400)
      .json({ success: false, message: "Secret key must start with sk_" });
  }

  try {
    const client = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });
    const response = await client.get("/balance");
    res.status(200).json({
      success: true,
      data: response.data.data,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = status === 401 ? "Invalid secret key" : "Paystack error — try again";
    res.status(status === 401 ? 400 : 502).json({ success: false, message });
  }
};

const testShaqExpressHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const userRoles = Array.isArray(req.user?.platformRoles) ? req.user.platformRoles : [];
  const userMaxLevel = Math.max(0, ...userRoles.map((r) => ROLE_HIERARCHY[r] || 0));
  const isAuthorized =
    req.user?.isSuperAdmin === true ||
    userMaxLevel >= ROLE_HIERARCHY.platform_technical ||
    req.user?.permissions?.manage_billing === true;
  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { identifier, secret } = req.body;
  if (!identifier || !secret) {
    return res
      .status(400)
      .json({ success: false, message: "Identifier and secret are required" });
  }

  try {
    const response = await axios.post(
      "https://public-api.shaqexpress.com/api/v1/auth/login",
      { identifier, secret }
    );
    res.status(200).json({
      success: true,
      data: { token: response.data?.data?.token },
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = status === 401 ? "Invalid identifier or secret" : "ShaQ Express error — try again";
    res.status(status === 401 ? 400 : 502).json({ success: false, message });
  }
};

const applyPaymentGatewaySettings = (tenant, paymentGateway, changes) => {
  if (paymentGateway === undefined) return;
  if (!["platform", "own"].includes(paymentGateway)) {
    throw new Error("Invalid payment gateway mode");
  }
  if (tenant.paymentGateway !== paymentGateway) {
    changes.push({ field: "paymentGateway", from: tenant.paymentGateway, to: paymentGateway });
    tenant.paymentGateway = paymentGateway;
  }
};

const applyDeliveryGatewaySettings = (tenant, deliveryGateway, changes) => {
  if (deliveryGateway === undefined) return;
  if (!["platform", "own"].includes(deliveryGateway)) {
    throw new Error("Invalid delivery gateway mode");
  }
  if (tenant.deliveryGateway !== deliveryGateway) {
    changes.push({ field: "deliveryGateway", from: tenant.deliveryGateway, to: deliveryGateway });
    tenant.deliveryGateway = deliveryGateway;
  }
};

const applyPaystackSettings = (tenant, paystackPublicKey, paystackSecretKey, changes) => {
  if (paystackPublicKey !== undefined && tenant.paystackPublicKey !== paystackPublicKey) {
    tenant.paystackPublicKey = paystackPublicKey;
    changes.push({ field: "paystackPublicKey", changed: true });
  }
  if (paystackSecretKey !== undefined && paystackSecretKey !== null && String(paystackSecretKey).trim() !== "") {
    tenant.paystackSecretKey = secretEncryption.encrypt(paystackSecretKey);
    changes.push({ field: "paystackSecretKey", changed: true });
  }
};

const applyShaqExpressSettings = (tenant, shaqexpressIdentifier, shaqexpressSecret, shaqexpressWebhookUrl, changes) => {
  if (
    shaqexpressIdentifier === undefined &&
    shaqexpressSecret === undefined &&
    shaqexpressWebhookUrl === undefined
  ) {
    return;
  }
  const settings = tenant.settings || {};
  const existingSecret = settings.shaqexpress_config?.secret ?? null;
  const rawSecret = shaqexpressSecret === undefined ? existingSecret : shaqexpressSecret;
  const shaqConfig = {
    identifier: shaqexpressIdentifier ?? settings.shaqexpress_config?.identifier ?? null,
    secret: rawSecret === null ? null : secretEncryption.encrypt(String(rawSecret)),
    webhookUrl: shaqexpressWebhookUrl ?? settings.shaqexpress_config?.webhookUrl ?? null,
    enabled: true,
  };
  settings.shaqexpress_config = shaqConfig;
  tenant.settings = settings;
  changes.push({ field: "shaqexpress_config", changed: true });
};

const updateGatewayHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }

  const {
    paymentGateway,
    deliveryGateway,
    paystackPublicKey,
    paystackSecretKey,
    shaqexpressIdentifier,
    shaqexpressSecret,
    shaqexpressWebhookUrl,
  } = req.body;

  const changes = [];

  try {
    applyPaymentGatewaySettings(tenant, paymentGateway, changes);
    applyDeliveryGatewaySettings(tenant, deliveryGateway, changes);
    applyPaystackSettings(tenant, paystackPublicKey, paystackSecretKey, changes);
    applyShaqExpressSettings(tenant, shaqexpressIdentifier, shaqexpressSecret, shaqexpressWebhookUrl, changes);
  } catch (err) {
    return response.badRequest(res, err.message);
  }

  await tenant.save();

  if (changes.length > 0) {
    await auditLog(req, "tenant.gateway_updated", "tenant", tenant.id, { changes }, { tenantId: tenant.id });
  }

  res.status(200).json({ success: true, item: sanitizeTenant(tenant) });
};

module.exports = {
  createTenantHandler,
  getTenantsHandler,
  getTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
  exportTenantDataHandler,
  exportSelfTenantDataHandler,
  enableTenantHandler,
  disableTenantHandler,
  getDashboardHandler,
  testPaystackHandler,
  testShaqExpressHandler,
  updateGatewayHandler,
};
