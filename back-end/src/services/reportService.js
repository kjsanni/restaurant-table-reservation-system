const paymentService = require("../services/paymentService");
const reservationDAO = require("../DAOs/reservation.dao");
const { Op, fn, col } = require("../db/models");

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

const exportCSV = async (filters = {}) => {
  const report = await getReservationReport(filters);
  let csv = "ID,Date,Time,Status,Payment Status,People,Customer\n";
  report.reservations.forEach((r) => {
    csv += `${r.id},${r.resDate},${r.resTime},${r.resStatus},${r.paymentStatus},${r.people},"${r.name || ""}"\n`;
  });
  return csv;
};

const exportPDF = async (filters = {}) => {
  const report = await getReservationReport(filters);
  let text = "RESERVATION REPORT\n";
  text += "==================\n\n";
  text += `Generated: ${new Date().toLocaleString()}\n`;
  text += `Total Reservations: ${report.totalReservations}\n\n`;
  text += "PAYMENT BREAKDOWN\n";
  report.paymentBreakdown.byMethod.forEach((m) => {
    text += `  ${m.method}: $${m.total.toFixed(2)} (${m.count} payments)\n`;
  });
  text += `\nTotal Revenue: $${report.paymentBreakdown.totalRevenue.toFixed(2)}\n`;
  return text;
};

module.exports = {
  getReservationReport,
  exportCSV,
  exportPDF,
};
