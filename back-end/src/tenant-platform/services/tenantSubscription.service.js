const db = require("../../db/models");
const { io } = require("../../utils/server");

const PLANS = {
  starter: { maxTables: 10, maxReservationsPerMonth: 500, price: 29 },
  growth: { maxTables: 30, maxReservationsPerMonth: 2000, price: 79 },
  enterprise: { maxTables: Infinity, maxReservationsPerMonth: Infinity, price: null },
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

  const mrr = await db.tenant.sum(db.sequelize.literal(`
    CASE plan
      WHEN 'starter' THEN 29
      WHEN 'growth' THEN 79
      WHEN 'enterprise' THEN 0
      ELSE 0
    END
  `), {
    where: { status: { [db.Sequelize.Op.in]: ["active", "past_due", "trialing"] } },
  });

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

  return {
    total,
    active,
    pastDue,
    suspended,
    cancelled,
    trialing,
    mrr: mrr || 0,
    recentTenants,
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

  const plan = PLANS[tenant.plan] || PLANS.starter;

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
};

module.exports = {
  checkPastDue,
  enableTenant,
  disableTenant,
  getTenantDashboard,
  syncFromPaymentGateway,
  checkUsageLimit,
  PLANS,
};
