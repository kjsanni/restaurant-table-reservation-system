const db = require("../../db/models");
const { withReplicaFallback } = require("../../db/readReplica");

const ANONYMITY_THRESHOLD = 10;

const benchmarkDAO = {};

benchmarkDAO.getPlatformBenchmarks = async (planFilter = null) => {
  return withReplicaFallback(async ({ useMaster }) => {
    const tenantWhere = {};
    if (planFilter) {
      tenantWhere.plan = planFilter;
    }

    const tenants = await db.tenant.findAll({
      where: tenantWhere,
      attributes: ["id", "plan", "restaurantType"],
      raw: true,
      ...(useMaster !== null ? { useMaster } : {}),
    });

    if (tenants.length === 0) {
      return {
        totalTenantsAnalyzed: 0,
        byPlan: {},
        byRestaurantType: {},
        overall: null,
      };
    }

    const tenantIds = tenants.map((t) => t.id);

    const reservations = await db.reservation.findAll({
      where: { tenantId: tenantIds },
      attributes: [
        "tenantId",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "total"],
        [
          db.sequelize.fn(
            "SUM",
            db.sequelize.literal(`CASE WHEN "resStatus" = 'missed' THEN 1 ELSE 0 END`)
          ),
          "missed",
        ],
        [
          db.sequelize.fn(
            "SUM",
            db.sequelize.literal(`CASE WHEN "resStatus" IN ('completed','seated') THEN 1 ELSE 0 END`)
          ),
          "fulfilled",
        ],
        [
          db.sequelize.fn(
            "SUM",
            db.sequelize.literal(`CASE WHEN "resStatus" = 'cancelled' THEN 1 ELSE 0 END`)
          ),
          "cancelled",
        ],
        [
          db.sequelize.fn("AVG", db.sequelize.col("people")),
          "avgPartySize",
        ],
      ],
      group: ["reservation.tenantId"],
      raw: true,
      ...(useMaster !== null ? { useMaster } : {}),
    });

    const reservationMap = {};
    reservations.forEach((r) => {
      reservationMap[r.tenantId] = {
        total: parseInt(r.total, 10),
        missed: parseInt(r.missed, 10),
        fulfilled: parseInt(r.fulfilled, 10),
        cancelled: parseInt(r.cancelled, 10),
        avgPartySize: parseFloat(r.avgPartySize) || 0,
      };
    });

    const eligibleTenants = tenants
      .map((t) => {
        const stats = reservationMap[t.id];
        if (!stats || stats.total < ANONYMITY_THRESHOLD) return null;
        return {
          plan: t.plan,
          restaurantType: t.restaurantType,
          noShowRate: stats.total > 0 ? stats.missed / stats.total : 0,
          fulfilmentRate: stats.total > 0 ? stats.fulfilled / stats.total : 0,
          cancellationRate: stats.total > 0 ? stats.cancelled / stats.total : 0,
          avgPartySize: stats.avgPartySize,
          totalReservations: stats.total,
        };
      })
      .filter(Boolean);

    const groupBy = (key) => {
      const map = new Map();
      eligibleTenants.forEach((t) => {
        const group = t[key] || "unknown";
        if (!map.has(group)) {
          map.set(group, []);
        }
        map.get(group).push(t);
      });
      return map;
    };

    const summarize = (items) => {
      if (items.length === 0) return null;
      const avg = (field) =>
        Math.round((items.reduce((s, i) => s + i[field], 0) / items.length) * 100);
      return {
        tenantCount: items.length,
        avgNoShowRate: avg("noShowRate"),
        avgFulfilmentRate: avg("fulfilmentRate"),
        avgCancellationRate: avg("cancellationRate"),
        avgPartySize: Math.round(items.reduce((s, i) => s + i.avgPartySize, 0) / items.length * 10) / 10,
        avgReservationsPerTenant: Math.round(
          items.reduce((s, i) => s + i.totalReservations, 0) / items.length
        ),
      };
    };

    const byPlan = {};
    groupBy("plan").forEach((items, plan) => {
      byPlan[plan] = summarize(items);
    });

    const byRestaurantType = {};
    groupBy("restaurantType").forEach((items, type) => {
      byRestaurantType[type] = summarize(items);
    });

    const overall = summarize(eligibleTenants);

    return {
      totalTenantsAnalyzed: eligibleTenants.length,
      totalTenantsExcluded: tenants.length - eligibleTenants.length,
      anonymityThreshold: ANONYMITY_THRESHOLD,
      byPlan,
      byRestaurantType,
      overall,
    };
  }, { label: "benchmark.getPlatformBenchmarks" });
};

module.exports = benchmarkDAO;
