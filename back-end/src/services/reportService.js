const paymentService = require("../services/paymentService");
const reservationDAO = require("../DAOs/reservation.dao");
const { Op, fn, col } = require("../db/models");
const { generateTextPdf } = require("../utils/pdfGenerator");

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[=+\-@]/.test(str[0]) || str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const getReservationReport = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.resStatus) where.resStatus = filters.resStatus;

  const totalReservations = await reservationDAO.findAllReservationsRaw(where, tenantId);

  const stats = await reservationDAO.getReservationStats(filters, tenantId);

  const paymentBreakdown = await paymentService.getRevenueStats(filters.from, filters.to, tenantId);

  return {
    totalReservations: totalReservations.length,
    reservations: totalReservations,
    stats,
    paymentBreakdown,
    filters,
  };
};

const getTurnTimeReport = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };

  const results = await reservationDAO.findAllReservationsRaw(where, tenantId);
  const eligible = results.filter((r) => r.seatedAt && r.completedAt);

  const turnTimes = eligible.map((r) => {
    const seated = new Date(r.seatedAt).getTime();
    const completed = new Date(r.completedAt).getTime();
    const minutes = (completed - seated) / (1000 * 60);
    return {
      reservationId: r.id,
      tableId: r.tableId,
      tableName: r.tableName,
      resDate: r.resDate,
      seatedAt: r.seatedAt,
      completedAt: r.completedAt,
      turnMinutes: Math.round(minutes),
    };
  });

  const total = turnTimes.length;
  const avg = total ? Math.round(turnTimes.reduce((sum, t) => sum + t.turnMinutes, 0) / total) : 0;
  const byTable = {};
  turnTimes.forEach((t) => {
    const key = t.tableId || "unknown";
    if (!byTable[key]) byTable[key] = { tableId: key, tableName: t.tableName, times: [] };
    byTable[key].times.push(t.turnMinutes);
  });

  const tableSummaries = Object.values(byTable).map(({ tableId, tableName, times }) => {
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      tableId,
      tableName,
      count: times.length,
      avg: Math.round(sum / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
    };
  });

  return { total, avg, turnTimes, tableSummaries };
};

const exportCSV = async (filters = {}, tenantId) => {
  const report = await getReservationReport(filters, tenantId);
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

const exportPDF = async (filters = {}, tenantId) => {
  const report = await getReservationReport(filters, tenantId);
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
  getTurnTimeReport,
  exportCSV,
  exportPDF,
};
