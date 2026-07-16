const paymentService = require("../services/paymentService");
const reservationDAO = require("../DAOs/reservation.dao");
const { Op, fn, col } = require("../db/models");
const { generateTextPdf } = require("../utils/pdfGenerator");

const getReservationReport = async (filters = {}) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.resStatus) where.resStatus = filters.resStatus;

  const totalReservations = await reservationDAO.findAllReservationsRaw(where);
  
  const stats = await reservationDAO.getReservationStats(filters);
  
  const paymentBreakdown = await paymentService.getRevenueStats(filters.from, filters.to);
  
  return {
    totalReservations: totalReservations.length,
    reservations: totalReservations,
    stats,
    paymentBreakdown,
    filters,
  };
};

const csvCell = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  // Wrap in quotes and double internal quotes; wrapping a cell whose value
  // starts with = + - @ makes CSV readers treat it as literal text instead
  // of executing a formula (formula-injection defence).
  const needsQuote = /[",\n]/.test(str) || /^=[+\-@]/.test(str);
  const safe = str.replace(/"/g, '""');
  return needsQuote ? `"${safe}"` : safe;
};

const exportCSV = async (filters = {}) => {
  const report = await getReservationReport(filters);
  const header = ["ID", "Date", "Time", "Status", "Payment Status", "People", "Customer"];
  let csv = header.map(csvCell).join(",") + "\n";
  report.reservations.forEach((r) => {
    csv +=
      [
        r.id,
        r.resDate,
        r.resTime,
        r.resStatus,
        r.paymentStatus,
        r.people,
        r.name || "",
      ]
        .map(csvCell)
        .join(",") + "\n";
  });
  return csv;
};

const exportPDF = async (filters = {}) => {
  const report = await getReservationReport(filters);
  const lines = [];
  lines.push("RESERVATION REPORT");
  lines.push("==================");
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  const range =
    [filters.from, filters.to].filter(Boolean).join(" to ") || "All dates";
  lines.push(`Period: ${range}`);
  lines.push(`Total Reservations: ${report.totalReservations}`);
  lines.push("");
  lines.push("PAYMENT BREAKDOWN");
  (report.paymentBreakdown.byMethod || []).forEach((m) => {
    lines.push(
      `  ${m.method}: GHS ${Number(m.total || 0).toFixed(2)} (${m.count} payments)`
    );
  });
  lines.push(
    `Total Revenue: GHS ${Number(report.paymentBreakdown.totalRevenue || 0).toFixed(2)}`
  );
  lines.push(
    `Average Payment: GHS ${Number(report.paymentBreakdown.avgPayment || 0).toFixed(2)}`
  );
  return generateTextPdf(lines);
};

module.exports = {
  getReservationReport,
  exportCSV,
  exportPDF,
};
