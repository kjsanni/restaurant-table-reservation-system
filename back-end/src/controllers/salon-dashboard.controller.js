"use strict";
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const stationDao = require("../verticals/salon/DAOs/station.dao");

const getSalonDashboardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant context required" });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [todayStats, utilization] = await Promise.all([
      appointmentDao.getTodayStats(tenantId),
      stationDao.getUtilization(tenantId, startOfDay, endOfDay),
    ]);

    return res.status(200).json({
      success: true,
      kpis: {
        appointmentsToday: todayStats.appointmentsToday,
        revenueToday: todayStats.revenueToday,
        clientsToday: todayStats.clientsToday,
        chairUtilization: {
          percent: utilization.utilizationPercent,
          occupied: utilization.occupiedCount,
          total: utilization.totalCount,
        },
      },
    });
  } catch (err) {
    console.error("getSalonDashboardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};

module.exports = {
  getSalonDashboardHandler,
};
