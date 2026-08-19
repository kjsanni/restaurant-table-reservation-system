"use strict";

const db = require("../../db/models");

const PII_FIELDS = ["email", "phone", "address", "firstName", "lastName", "ipAddress"];

const scrubPII = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const scrubbed = { ...obj };
  for (const field of PII_FIELDS) {
    if (scrubbed[field] !== undefined) {
      scrubbed[field] = "[REDACTED]";
    }
  }
  return scrubbed;
};

const PlatformAnalytics = {
  async getAggregatedMetrics({ from, to } = {}) {
    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[db.Sequelize.Op.gte] = new Date(from);
      if (to) where.createdAt[db.Sequelize.Op.lte] = new Date(to);
    }

    const reservations = await db.reservation.findAll({ where, attributes: ["tenantId", "status", "createdAt"] });
    const customers = await db.customer.findAll({ where, attributes: ["tenantId", "createdAt"] });

    const metrics = reservations.reduce(
      (acc, r) => {
        acc.byTenant[r.tenantId] = acc.byTenant[r.tenantId] || { total: 0, byStatus: {} };
        acc.byTenant[r.tenantId].total++;
        acc.byTenant[r.tenantId].byStatus[r.status] = (acc.byTenant[r.tenantId].byStatus[r.status] || 0) + 1;
        acc.total++;
        acc.byStatus[r.status] = (acc.byStatus[r.status] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {}, byTenant: {} }
    );

    const customerCounts = customers.reduce(
      (acc, c) => {
        acc.byTenant[c.tenantId] = (acc.byTenant[c.tenantId] || 0) + 1;
        acc.total++;
        return acc;
      },
      { total: 0, byTenant: {} }
    );

    return {
      period: { from, to: to || new Date().toISOString() },
      reservations: metrics,
      customers: customerCounts,
      timestamp: new Date().toISOString(),
    };
  },

  async getTenantCohorts() {
    const tenants = await db.tenant.findAll({
      attributes: ["id", "name", "plan", "status", "createdAt", "convertedFromTrialAt"],
    });

    const cohorts = tenants.map((t) => {
      const trialDuration = t.convertedFromTrialAt
        ? Math.ceil((new Date(t.convertedFromTrialAt) - new Date(t.createdAt)) / (1000 * 60 * 60 * 24))
        : null;

      return scrubPII({
        tenantId: t.id,
        tenantName: t.name,
        plan: t.plan,
        status: t.status,
        createdAt: t.createdAt,
        trialDurationDays: trialDuration,
      });
    });

    return cohorts;
  },

  async getPIIAuditLog() {
    const logs = await db.auditLog.findAll({
      where: {
        action: { [db.Sequelize.Op.like]: "%pii%" },
      },
      limit: 100,
      order: [["createdAt", "DESC"]],
    });

    return logs.map((l) => scrubPII(l.toJSON()));
  },
};

module.exports = PlatformAnalytics;
