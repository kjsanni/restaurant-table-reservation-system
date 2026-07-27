const db = require("../../db/models");
const {
  enableTenant,
  disableTenant,
  getTenantDashboard,
} = require("../services/tenantSubscription.service");
const { applyTypeDefaults } = require("../services/tenantTypeDefaults.service");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const createTenantHandler = async (req, res) => {
  const { name, slug, domain, plan, status, billingEmail, billingName, currency, restaurantType } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, message: "Name and slug are required" });
  }

  const normalizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!normalizedSlug) {
    return res.status(400).json({ success: false, message: "Slug must contain only lowercase letters, numbers, and hyphens" });
  }

  const existing = await db.tenant.findOne({ where: { slug: normalizedSlug } });
  if (existing) {
    return res.status(409).json({ success: false, message: `Slug "${normalizedSlug}" is already in use` });
  }

  const tenant = await db.tenant.create({
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
  const { rows, count } = await db.tenant.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: parseInt(pageSize, 10),
    offset,
    attributes: [
      "id",
      "name",
      "slug",
      "domain",
      "settings",
      "plan",
      "status",
      "subscriptionStatus",
      "currentPeriodEnd",
      "graceEndsAt",
      "suspendedAt",
      "suspendedReason",
      "currency",
      "restaurantType",
      "restaurantSubtype",
      "serviceModes",
      "createdAt",
      "updatedAt",
    ],
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
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const allowed = ["name", "plan", "settings", "billingEmail", "billingName", "currency", "restaurantType", "restaurantSubtype", "serviceModes", "businessVertical", "whatsappConfig"];
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
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  if (tenant.status === "cancelled") {
    return res.status(400).json({ success: false, message: "Tenant is already deleted" });
  }

  await tenant.update({ status: "cancelled" });

  await platformAuditDAO.log(
    req.user?.id || null,
    "tenant.deleted",
    "tenant",
    tenant.id,
    tenant.id,
    { tenantId: tenant.id, tenantName: tenant.name, tenantSlug: tenant.slug },
    req.ip
  );

  res.status(200).json({ success: true, message: "Tenant deleted successfully", item: tenant });
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

const getDashboardHandler = async (req, res) => {
  const dashboard = await getTenantDashboard();
  res.status(200).json({ success: true, ...dashboard });
};

module.exports = {
  createTenantHandler,
  getTenantsHandler,
  getTenantHandler,
  updateTenantHandler,
  deleteTenantHandler,
  enableTenantHandler,
  disableTenantHandler,
  getDashboardHandler,
};
