const db = require("../../db/models");
const {
  enableTenant,
  disableTenant,
  getTenantDashboard,
} = require("../services/tenantSubscription.service");

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
      "plan",
      "status",
      "subscriptionStatus",
      "currentPeriodEnd",
      "graceEndsAt",
      "suspendedAt",
      "suspendedReason",
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

  const allowed = ["name", "plan", "settings", "billingEmail", "billingName", "currency"];
  const updates = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }

  await tenant.update(updates);
  res.status(200).json({ success: true, item: tenant });
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
  getTenantsHandler,
  getTenantHandler,
  updateTenantHandler,
  enableTenantHandler,
  disableTenantHandler,
  getDashboardHandler,
};
