const tenantAdminDAO = require("../DAOs/tenantAdmin.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const {
  enableTenant,
  disableTenant,
  getTenantDashboard,
} = require("../services/tenantSubscription.service");
const { applyTypeDefaults } = require("../services/tenantTypeDefaults.service");
const axios = require("axios");
const { normalizeSettingValue } = require("../../utils/settings");

const createTenantHandler = async (req, res) => {
  const { name, slug, domain, plan, status, billingEmail, billingName, currency, restaurantType } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, message: "Name and slug are required" });
  }

  const normalizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!normalizedSlug) {
    return res.status(400).json({ success: false, message: "Slug must contain only lowercase letters, numbers, and hyphens" });
  }

  const existing = await tenantAdminDAO.findBySlug(normalizedSlug);
  if (existing) {
    return res.status(409).json({ success: false, message: `Slug "${normalizedSlug}" is already in use` });
  }

  const tenant = await tenantAdminDAO.create({
    name,
    slug: normalizedSlug,
    domain,
    plan: plan || "starter",
    status: status || "active",
    billingEmail,
    billingName,
    currency: currency || "GHS",
    settings: {},
  });

  applyTypeDefaults(tenant, restaurantType || "full_service");
  await tenant.save();

  res.status(201).json({ success: true, item: tenant });
};

const getTenantsHandler = async (req, res) => {
  const { status, plan, page = 1, pageSize = 20 } = req.query;
  const where = {};

  if (status) where.status = status;
  if (plan) where.plan = plan;

  const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
  const { rows, count } = await tenantAdminDAO.list({
    status,
    plan,
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
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  res.status(200).json({ success: true, item: tenant });
};

const updateTenantHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const allowed = ["name", "plan", "settings", "billingEmail", "billingName", "currency", "restaurantType", "restaurantSubtype", "serviceModes", "businessVertical", "whatsappConfig", "dataRegion", "residencyNotes"];
  const updates = {};
  const changes = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      const next = req.body[key];
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
    await platformAuditDAO.log(
      req.user?.id || null,
      "tenant.updated",
      "tenant",
      tenant.id,
      tenant.id,
      { changes },
      req.ip
    );
  }

  res.status(200).json({ success: true, item: tenant });
};

const deleteTenantHandler = async (req, res) => {
  try {
    const tenant = await tenantAdminDAO.softDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
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
      return res.status(400).json({ success: false, message: "Tenant is already deleted" });
    }
    throw err;
  }
};

const enableTenantHandler = async (req, res) => {
  try {
    const tenant = await enableTenant(req.params.id);
    res.status(200).json({ success: true, item: tenant });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const disableTenantHandler = async (req, res) => {
  const { reason } = req.body;
  try {
    const tenant = await disableTenant(req.params.id, reason);
    res.status(200).json({ success: true, item: tenant });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const exportTenantDataHandler = async (req, res) => {
  const exported = await tenantAdminDAO.export(req.params.id);
  if (!exported) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    tenant: exported.tenant.toJSON(),
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
      const str = String(obj[f]);
      obj[f] = str.slice(-4).padStart(str.length, "*");
    }
  }
  if (obj.settings) {
    const cfg = normalizeSettingValue(obj.settings);
    if (cfg.shaqexpress_config) {
      if (cfg.shaqexpress_config.secret) {
        const s = String(cfg.shaqexpress_config.secret);
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
    return res.status(404).json({ success: false, message: "Tenant not found" });
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
    const message =
      status === 401
        ? "Invalid secret key"
        : "Paystack error — try again";
    res.status(status === 401 ? 400 : 502).json({ success: false, message });
  }
};

const testShaqExpressHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
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
    const message =
      status === 401
        ? "Invalid identifier or secret"
        : "ShaQ Express error — try again";
    res.status(status === 401 ? 400 : 502).json({ success: false, message });
  }
};

const updateGatewayHandler = async (req, res) => {
  const tenant = await tenantAdminDAO.findById(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
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

  if (paymentGateway !== undefined) {
    if (!["platform", "own"].includes(paymentGateway)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment gateway mode" });
    }
    if (tenant.paymentGateway !== paymentGateway) {
      changes.push({ field: "paymentGateway", from: tenant.paymentGateway, to: paymentGateway });
      tenant.paymentGateway = paymentGateway;
    }
  }

  if (deliveryGateway !== undefined) {
    if (!["platform", "own"].includes(deliveryGateway)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid delivery gateway mode" });
    }
    if (tenant.deliveryGateway !== deliveryGateway) {
      changes.push({ field: "deliveryGateway", from: tenant.deliveryGateway, to: deliveryGateway });
      tenant.deliveryGateway = deliveryGateway;
    }
  }

  if (paystackPublicKey !== undefined && tenant.paystackPublicKey !== paystackPublicKey) {
    tenant.paystackPublicKey = paystackPublicKey;
    changes.push({ field: "paystackPublicKey", changed: true });
  }

  if (paystackSecretKey !== undefined && paystackSecretKey !== null) {
    tenant.paystackSecretKey = paystackSecretKey;
    changes.push({ field: "paystackSecretKey", changed: true });
  }

  if (
    shaqexpressIdentifier !== undefined ||
    shaqexpressSecret !== undefined ||
    shaqexpressWebhookUrl !== undefined
  ) {
    const settings = tenant.settings || {};
    const shaqConfig = {
      identifier: shaqexpressIdentifier ?? settings.shaqexpress_config?.identifier ?? null,
      secret: shaqexpressSecret ?? settings.shaqexpress_config?.secret ?? null,
      webhookUrl: shaqexpressWebhookUrl ?? settings.shaqexpress_config?.webhookUrl ?? null,
      enabled: true,
    };
    settings.shaqexpress_config = shaqConfig;
    tenant.settings = settings;
    changes.push({ field: "shaqexpress_config", changed: true });
  }

  await tenant.save();

  if (changes.length > 0) {
    await platformAuditDAO.log(
      req.user?.id || null,
      "tenant.gateway_updated",
      "tenant",
      tenant.id,
      tenant.id,
      { changes },
      req.ip
    );
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
  enableTenantHandler,
  disableTenantHandler,
  getDashboardHandler,
  testPaystackHandler,
  testShaqExpressHandler,
  updateGatewayHandler,
};
