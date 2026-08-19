"use strict";

const db = require("../../db/models");

const TenantMetering = {
  async getTenantMetrics(tenantId) {
    const tenant = await db.tenant.findByPk(tenantId);
    if (!tenant) {
      return null;
    }

    const tablesCount = await db.table.count({ where: { tenantId } });
    const customersCount = await db.customer.count({ where: { tenantId } });
    const reservationsCount = await db.reservation.count({ where: { tenantId } });
    const waitlistCount = await db.waitlist.count({ where: { tenantId } });
    const staffCount = await db.user.count({ where: { tenantId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const reservationsThisMonth = await db.reservation.count({
      where: {
        tenantId,
        createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
      },
    });

    const storageEstimate = await this.estimateStorage(tenantId);

    const apiMetrics = await this.getApiMetrics(tenantId);

    return {
      tenantId,
      tenantName: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      metrics: {
        tables: tablesCount,
        customers: customersCount,
        reservations: reservationsCount,
        reservationsThisMonth,
        waitlistEntries: waitlistCount,
        staff: staffCount,
        storage: storageEstimate,
        api: apiMetrics,
      },
      timestamp: new Date().toISOString(),
    };
  },

  async estimateStorage(tenantId) {
    const tables = await db.table.count({ where: { tenantId } });
    const customers = await db.customer.count({ where: { tenantId } });
    const reservations = await db.reservation.count({ where: { tenantId } });

    const estimatedRows = tables + customers + reservations;
    const estimatedBytes = estimatedRows * 1024;
    const estimatedMB = Math.round(estimatedBytes / (1024 * 1024));

    return {
      estimatedRows,
      estimatedBytes,
      estimatedMB,
    };
  },

  async getApiMetrics(tenantId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayEvents = await db.usageEvent.count({
      where: {
        tenantId,
        createdAt: { [db.Sequelize.Op.gte]: startOfDay },
      },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthEvents = await db.usageEvent.count({
      where: {
        tenantId,
        createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
      },
    });

    return {
      callsToday: todayEvents,
      callsThisMonth: monthEvents,
    };
  },

  async getPlatformMetrics() {
    const tenants = await db.tenant.findAll();
    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === "active").length;

    const totalTables = await db.table.count();
    const totalReservations = await db.reservation.count();
    const totalCustomers = await db.customer.count();

    return {
      totalTenants,
      activeTenants,
      totalTables,
      totalReservations,
      totalCustomers,
      timestamp: new Date().toISOString(),
    };
  },
};

module.exports = TenantMetering;
