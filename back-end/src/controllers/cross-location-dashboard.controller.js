"use strict";
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");
const locationDao = require("../verticals/salon/DAOs/location.dao");
const staffDao = require("../verticals/salon/DAOs/staff.dao");
const stationDao = require("../verticals/salon/DAOs/station.dao");

const getCrossLocationDashboardHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: "Tenant context required" });
    }

    const { from, to } = req.query;

    const [locations, locationSummary, staffCount, stationCount, todayStats] = await Promise.all([
      locationDao.findAllForTenant(tenantId),
      appointmentDao.getLocationSummary(tenantId, from, to),
      staffDao.findAllForTenant(tenantId, { limit: 1000 }).then((r) => r.data?.length || r.length || 0),
      stationDao.findAllForTenant(tenantId, { limit: 1000 }).then((r) => r.data?.length || r.length || 0),
      appointmentDao.getTodayStats(tenantId),
    ]);

    const totalLocations = locations.length || 0;
    const totalRevenue = locationSummary.reduce((sum, item) => sum + item.revenue, 0);
    const totalAppointments = locationSummary.reduce((sum, item) => sum + item.appointmentCount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalLocations,
        totalStaff: staffCount,
        totalStations: stationCount,
        totalRevenue,
        totalAppointments,
        appointmentsToday: todayStats.appointmentsToday,
        revenueToday: todayStats.revenueToday,
      },
      locations: locationSummary,
      locationDetails: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        region: loc.region,
        latitude: loc.latitude,
        longitude: loc.longitude,
        isPrimary: loc.isPrimary,
        isActive: loc.isActive,
      })),
    });
  } catch (err) {
    console.error("getCrossLocationDashboardHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load cross-location dashboard" });
  }
};

module.exports = {
  getCrossLocationDashboardHandler,
};
