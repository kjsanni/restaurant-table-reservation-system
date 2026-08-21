const db = require("../../db/models");

const DEFAULT_PLANS = {
  starter: { maxTables: 10, maxReservationsPerMonth: 500, price: 299, currency: "GHS", name: "Starter", erpnextModules: [], byokTier: "platform_only" },
  growth: { maxTables: 25, maxReservationsPerMonth: 2000, price: 599, currency: "GHS", name: "Growth", erpnextModules: ["erpnext_accounting", "erpnext_crm"], byokTier: "optional" },
  scale: { maxTables: 100, maxReservationsPerMonth: 10000, price: 999, currency: "GHS", name: "Scale", erpnextModules: null, byokTier: "required" },
};

const getPlans = async () => {
  const rows = await db.subscriptionPlan.findAll({
    where: { isActive: true },
    order: [["sortOrder", "ASC"], ["price", "ASC"]],
  });
  const plans = {};
  for (const row of rows) {
    const rawPrice = row.price !== null && row.price !== undefined ? parseFloat(row.price) : null;
    plans[row.slug] = {
      maxTables: row.maxTables,
      maxReservationsPerMonth: row.maxReservationsPerMonth,
      price: Number.isNaN(rawPrice) ? null : rawPrice,
      currency: row.currency,
      name: row.name,
      erpnextModules: row.erpnextModules !== null && row.erpnextModules !== undefined ? row.erpnextModules : null,
      byokTier: row.features?.byokTier || DEFAULT_PLANS[row.slug]?.byokTier || "platform_only",
    };
  }
  return { ...DEFAULT_PLANS, ...plans };
};

let PLANS_CACHE = null;
let PLANS_CACHE_AT = 0;
const PLANS_CACHE_TTL = 30000;

const getPlansCached = async () => {
  const now = Date.now();
  if (!PLANS_CACHE || now - PLANS_CACHE_AT > PLANS_CACHE_TTL) {
    PLANS_CACHE = await getPlans();
    PLANS_CACHE_AT = now;
  }
  return PLANS_CACHE;
};

const invalidatePlansCache = () => {
  PLANS_CACHE = null;
  PLANS_CACHE_AT = 0;
};

const checkPastDue = async () => {
  const now = new Date();

  const pastDueTenants = await db.tenant.findAll({
    where: {
      status: "past_due",
      graceEndsAt: { [db.Sequelize.Op.lte]: now },
    },
  });

  for (const tenant of pastDueTenants) {
    await tenant.update({
      status: "suspended",
      suspendedAt: now,
      suspendedReason: "Payment overdue — grace period expired",
    });

    const { io } = require("../../utils/server");
    const namespace = io.of(`/tenant-${tenant.id}`);
    if (namespace) {
      namespace.emit("tenant-suspended", {
        tenantId: tenant.id,
        message: tenant.suspendedReason,
      });
    }
  }

  return pastDueTenants.length;
};

const enableTenant = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  await tenant.update({
    status: "active",
    suspendedAt: null,
    suspendedReason: null,
    subscriptionStatus: "active",
    graceEndsAt: null,
  });

  return tenant;
};

const disableTenant = async (tenantId, reason) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const now = new Date();
  await tenant.update({
    status: "suspended",
    suspendedAt: now,
    suspendedReason: reason || "Payment issue",
  });

  return tenant;
};

const getTenantDashboard = async () => {
  const total = await db.tenant.count();
  const active = await db.tenant.count({ where: { status: "active" } });
  const pastDue = await db.tenant.count({ where: { status: "past_due" } });
  const suspended = await db.tenant.count({ where: { status: "suspended" } });
  const cancelled = await db.tenant.count({ where: { status: "cancelled" } });
  const trialing = await db.tenant.count({ where: { status: "trialing" } });

  const plans = await getPlansCached();
  const tenants = await db.tenant.findAll({
    where: { status: ["active", "past_due", "trialing"] },
    attributes: ["plan"],
  });
  const mrr = tenants.reduce((sum, tenant) => {
    const price = plans[tenant.plan]?.price || 0;
    return sum + price;
  }, 0);

  const recentTenants = await db.tenant.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    attributes: [
      "id",
      "name",
      "slug",
      "plan",
      "status",
      "subscriptionStatus",
      "currentPeriodEnd",
      "createdAt",
    ],
  });

  const allTenants = await db.tenant.findAll({
    attributes: ["id", "settings"],
  });

  const erpnextEnabledCount = allTenants.filter((t) => {
    const flags = t.settings?.featureFlags || {};
    return Object.values(flags).some((v) => v === true && String(v).startsWith("erpnext_"));
  }).length;

  return {
    total,
    active,
    pastDue,
    suspended,
    cancelled,
    trialing,
    mrr: mrr || 0,
    recentTenants,
    erpnextEnabledCount,
  };
};

const syncFromPaymentGateway = async (tenantId, payload) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  switch (payload.event) {
    case "invoice.payment_succeeded":
      await tenant.update({
        status: "active",
        subscriptionStatus: "active",
        graceEndsAt: null,
        lastPaymentAt: new Date(),
        currentPeriodEnd: payload.nextBillingDate || tenant.currentPeriodEnd,
      });
      break;
    case "invoice.payment_failed":
      const graceDays = payload.graceDays || 7;
      const graceEndsAt = new Date();
      graceEndsAt.setDate(graceEndsAt.getDate() + graceDays);

      await tenant.update({
        subscriptionStatus: "past_due",
        status: "past_due",
        graceEndsAt,
      });
      break;
    case "subscription.cancelled":
      await tenant.update({
        status: "cancelled",
        subscriptionStatus: "cancelled",
        cancelAtPeriodEnd: true,
      });
      break;
    default:
      break;
  }

  return tenant;
};

const checkUsageLimit = async (tenantId, resource) => {
  if (!tenantId) return;

  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw { status: 404, message: "Tenant not found" };

  const plans = await getPlansCached();
  const plan = plans[tenant.plan] || plans.starter;

  if (resource === "tables") {
    if (plan.maxTables === Infinity) return;
    const count = await db.table.count({ where: { tenantId } });
    if (count >= plan.maxTables) {
      throw {
        status: 403,
        message: `Table limit reached (${plan.maxTables}). Upgrade your plan to add more tables.`,
      };
    }
  }

  if (resource === "reservations") {
    if (plan.maxReservationsPerMonth === Infinity) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const count = await db.reservation.count({
      where: {
        tenantId,
        createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
      },
    });
    if (count >= plan.maxReservationsPerMonth) {
      throw {
        status: 403,
        message: `Monthly reservation limit reached (${plan.maxReservationsPerMonth}). Upgrade your plan for more.`,
      };
    }
  }

  if (resource === "events" || resource === "bookings" || resource === "guests" || resource === "qr_codes") {
    const { checkEventUsageLimit } = require("./planLimits.service");
    await checkEventUsageLimit(tenantId, resource);
  }
};

module.exports = {
  checkPastDue,
  enableTenant,
  disableTenant,
  getTenantDashboard,
  syncFromPaymentGateway,
  checkUsageLimit,
  getPlansCached,
  invalidatePlansCache,
};
