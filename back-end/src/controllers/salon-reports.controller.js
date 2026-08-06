"use strict";
const appointmentDao = require("../verticals/salon/DAOs/appointment.dao");

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const fetchSalonReportData = async (tenantId, from, to) => {
  const [revenueByService, topStylists, appointmentsBySource, peakHours] = await Promise.all([
    appointmentDao.getRevenueByService(tenantId, from, to),
    appointmentDao.getTopStylists(tenantId, from, to),
    appointmentDao.getAppointmentsBySource(tenantId, from, to),
    appointmentDao.getPeakHours(tenantId, from, to),
  ]);

  const totalRevenue = revenueByService.reduce((sum, item) => sum + item.revenue, 0);
  const totalAppointments = appointmentsBySource.reduce((sum, item) => sum + item.appointmentCount, 0);

  return { revenueByService, topStylists, appointmentsBySource, peakHours, totalRevenue, totalAppointments };
};

const getSalonReportsHandler = async (req, res) => {
  try {
    const { revenueByService, topStylists, appointmentsBySource, peakHours, totalRevenue, totalAppointments } =
      await fetchSalonReportData(req.tenant?.id, req.query.from, req.query.to);

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalAppointments,
        dateRange: { from: req.query.from || null, to: req.query.to || null },
      },
      revenueByService,
      topStylists,
      appointmentsBySource,
      peakHours,
    });
  } catch (err) {
    console.error("getSalonReportsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reports" });
  }
};

const exportSalonReportsHandler = async (req, res) => {
  try {
    const { revenueByService, topStylists, appointmentsBySource, peakHours, totalRevenue, totalAppointments } =
      await fetchSalonReportData(req.tenant?.id, req.query.from, req.query.to);

    const rows = [
      ["Salon Reports Export"],
      [`Generated At`, new Date().toISOString()],
      [`Date Range`, `${req.query.from || "N/A"} to ${req.query.to || "N/A"}`],
      [],
      ["Summary"],
      ["Total Revenue", totalRevenue.toFixed(2)],
      ["Total Appointments", totalAppointments],
      [],
      ["Revenue by Service"],
      ["Service", "Revenue", "Appointment Count"],
      ...revenueByService.map((item) => [escapeCsv(item.serviceName || item.serviceId), escapeCsv(item.revenue.toFixed(2)), escapeCsv(item.appointmentCount)]),
      [],
      ["Top Stylists"],
      ["Stylist", "Appointment Count", "Revenue"],
      ...topStylists.map((item) => [escapeCsv(item.stylistName || item.userId), escapeCsv(item.appointmentCount), escapeCsv(item.revenue.toFixed(2))]),
      [],
      ["Appointments by Source"],
      ["Source", "Appointment Count"],
      ...appointmentsBySource.map((item) => [escapeCsv(item.source || "Unknown"), escapeCsv(item.appointmentCount)]),
      [],
      ["Peak Hours"],
      ["Hour", "Appointment Count"],
      ...peakHours.map((item) => [escapeCsv(item.hour), escapeCsv(item.appointmentCount)]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=salon-reports-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error("exportSalonReportsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to export reports" });
  }
};

module.exports = {
  getSalonReportsHandler,
  exportSalonReportsHandler,
};
