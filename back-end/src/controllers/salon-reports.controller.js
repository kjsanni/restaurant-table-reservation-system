"use strict";
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

const getSalonReportsHandler = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { from, to } = req.query;

    const [revenueByService, topStylists, appointmentsBySource] = await Promise.all([
      appointmentDao.getRevenueByService(tenantId, from, to),
      appointmentDao.getTopStylists(tenantId, from, to),
      appointmentDao.getAppointmentsBySource(tenantId, from, to),
    ]);

    const totalRevenue = revenueByService.reduce((sum, item) => sum + item.revenue, 0);
    const totalAppointments = appointmentsBySource.reduce((sum, item) => sum + item.appointmentCount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalAppointments,
        dateRange: { from: from || null, to: to || null },
      },
      revenueByService,
      topStylists,
      appointmentsBySource,
    });
  } catch (err) {
    console.error("getSalonReportsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reports" });
  }
};

module.exports = {
  getSalonReportsHandler,
};
