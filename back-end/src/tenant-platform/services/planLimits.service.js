"use strict";

const db = require("../../db/models");

const DEFAULT_EVENT_LIMITS = {
  maxEvents: 50,
  maxBookingsPerMonth: 500,
  maxGuestsPerEvent: 200,
  maxQRCodesPerEvent: 500,
};

const getEventLimits = (plan) => {
  const features = plan?.features || {};
  const limits = features.limits || {};
  return {
    maxEvents: limits.maxEvents ?? DEFAULT_EVENT_LIMITS.maxEvents,
    maxBookingsPerMonth: limits.maxBookingsPerMonth ?? DEFAULT_EVENT_LIMITS.maxBookingsPerMonth,
    maxGuestsPerEvent: limits.maxGuestsPerEvent ?? DEFAULT_EVENT_LIMITS.maxGuestsPerEvent,
    maxQRCodesPerEvent: limits.maxQRCodesPerEvent ?? DEFAULT_EVENT_LIMITS.maxQRCodesPerEvent,
  };
};

const checkEventUsageLimit = async (tenantId, resource) => {
  if (!tenantId) return;

  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) throw { status: 404, message: "Tenant not found" };

  const plans = await require("./tenantSubscription.service").getPlansCached();
  const plan = plans[tenant.plan] || plans.starter;
  const limits = getEventLimits(plan);

  if (resource === "events") {
    if (limits.maxEvents === Infinity) return;
    const count = await db.event.count({ where: { tenantId } });
    if (count >= limits.maxEvents) {
      throw {
        status: 403,
        message: `Event limit reached (${limits.maxEvents}). Upgrade your plan to create more events.`,
      };
    }
  }

  if (resource === "bookings") {
    if (limits.maxBookingsPerMonth === Infinity) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const count = await db.eventBooking.count({
      where: {
        tenantId,
        createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
      },
    });
    if (count >= limits.maxBookingsPerMonth) {
      throw {
        status: 403,
        message: `Monthly booking limit reached (${limits.maxBookingsPerMonth}). Upgrade your plan for more.`,
      };
    }
  }

  if (resource === "guests") {
    if (limits.maxGuestsPerEvent === Infinity) return;
  }

  if (resource === "qr_codes") {
    if (limits.maxQRCodesPerEvent === Infinity) return;
  }
};

const getEventUsage = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId);
  if (!tenant) return null;

  const plans = await require("./tenantSubscription.service").getPlansCached();
  const plan = plans[tenant.plan] || plans.starter;
  const limits = getEventLimits(plan);

  const eventsCount = await db.event.count({ where: { tenantId } });
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const bookingsCount = await db.eventBooking.count({
    where: {
      tenantId,
      createdAt: { [db.Sequelize.Op.gte]: startOfMonth },
    },
  });

  const eventsPercent = limits.maxEvents === Infinity ? 0 : Math.round((eventsCount / limits.maxEvents) * 100);
  const bookingsPercent = limits.maxBookingsPerMonth === Infinity ? 0 : Math.round((bookingsCount / limits.maxBookingsPerMonth) * 100);

  return {
    tenantId,
    plan: tenant.plan,
    limits,
    usage: {
      events: eventsCount,
      bookingsThisMonth: bookingsCount,
    },
    percentages: {
      events: eventsPercent,
      bookingsThisMonth: bookingsPercent,
    },
    warnings: {
      events: eventsPercent >= 80,
      bookingsThisMonth: bookingsPercent >= 80,
    },
  };
};

module.exports = {
  getEventLimits,
  checkEventUsageLimit,
  getEventUsage,
};
