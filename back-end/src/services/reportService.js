const paymentService = require("../services/paymentService");
const reservationDAO = require("../DAOs/reservation.dao");
const db = require("../db/models");
const { Op } = db.Sequelize;
const { generateTextPdf } = require("../utils/pdfGenerator");
const { formatMoney } = require("../utils/formatMoney");

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[=+\-@]/.test(str[0]) || str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const getReservationReport = async (filters = {}, tenantId, pagination = {}) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.resStatus) where.resStatus = filters.resStatus;

  const totalReservations = await reservationDAO.findAllReservationsRaw(where, tenantId);

  const stats = await reservationDAO.getReservationStats(filters, tenantId);

  const paymentBreakdown = await paymentService.getRevenueStats(filters.from, filters.to, tenantId);

  let reservations = totalReservations;
  let total = totalReservations.length;
  let page = undefined;
  let pageSize = undefined;
  let totalPages = undefined;

  if (pagination.limit) {
    pageSize = parseInt(pagination.limit, 10);
    page = pagination.offset ? Math.floor(parseInt(pagination.offset, 10) / pageSize) + 1 : 1;
    const start = (page - 1) * pageSize;
    reservations = totalReservations.slice(start, start + pageSize);
    total = totalReservations.length;
    totalPages = Math.ceil(total / pageSize);
  }

  return {
    totalReservations: total,
    reservations,
    stats,
    paymentBreakdown,
    filters,
    page,
    pageSize,
    totalPages,
  };
};

const getTurnTimeReport = async (filters = {}, tenantId, pagination = {}) => {
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

  let page = undefined;
  let pageSize = undefined;
  let totalPages = undefined;
  let paginatedTurnTimes = turnTimes;

  if (pagination.limit) {
    pageSize = parseInt(pagination.limit, 10);
    page = pagination.offset ? Math.floor(parseInt(pagination.offset, 10) / pageSize) + 1 : 1;
    const start = (page - 1) * pageSize;
    paginatedTurnTimes = turnTimes.slice(start, start + pageSize);
    totalPages = Math.ceil(total / pageSize);
  }

  return { total, avg, turnTimes: paginatedTurnTimes, tableSummaries, page, pageSize, totalPages };
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
  const currency = await formatMoney(0, tenantId).then((s) => s.split(" ")[0] || "GHS");
  for (const m of report.paymentBreakdown.byMethod || []) {
    const formatted = await formatMoney(Number(m.total || 0), tenantId);
    lines.push(`  ${m.method}: ${formatted} (${m.count} payments)`);
  }
  lines.push(`Total Revenue: ${await formatMoney(Number(report.paymentBreakdown.totalRevenue || 0), tenantId)}`);
  lines.push(`Average Payment: ${await formatMoney(Number(report.paymentBreakdown.avgPayment || 0), tenantId)}`);
  return generateTextPdf(lines);
};

const getTimeSeriesReport = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };

  const results = await reservationDAO.findAllReservationsRaw(where, tenantId);
  const byDate = {};
  results.forEach((r) => {
    if (!byDate[r.resDate]) byDate[r.resDate] = { date: r.resDate, count: 0, people: 0, revenue: 0 };
    byDate[r.resDate].count += 1;
    byDate[r.resDate].people += Number(r.people || 0);
  });

  const payments = await paymentService.getRevenueStats(filters.from, filters.to, tenantId);
  const paymentByDate = {};
  (payments.byMethod || []).forEach((m) => {
    m.breakdown && m.breakdown.forEach((b) => {
      if (!paymentByDate[b.date]) paymentByDate[b.date] = 0;
      paymentByDate[b.date] += Number(b.amount || 0);
    });
  });

  const timeSeries = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: d.date,
      reservations: d.count,
      covers: d.people,
      revenue: paymentByDate[d.date] || 0,
    }));

  return { timeSeries, totalRevenue: payments.totalRevenue || 0 };
};

const getCustomerAnalytics = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };

  const results = await reservationDAO.findAllReservationsRaw(where, tenantId);
  const byCustomer = {};
  results.forEach((r) => {
    const key = r.customerId || r.customerPhone || r.email || "unknown";
    if (!byCustomer[key]) byCustomer[key] = { customerId: r.customerId, name: r.name, email: r.email, phone: r.customerPhone, visits: 0, totalSpent: 0, lastVisit: null };
    byCustomer[key].visits += 1;
    byCustomer[key].totalSpent += Number(r.expectedTotal || 0);
    if (!byCustomer[key].lastVisit || r.resDate > byCustomer[key].lastVisit) byCustomer[key].lastVisit = r.resDate;
  });

  const customers = Object.values(byCustomer)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 100);

  return { customers, totalCustomers: Object.keys(byCustomer).length };
};

const getTableUtilization = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };

  const results = await reservationDAO.findAllReservationsRaw(where, tenantId);
  const byTable = {};
  results.forEach((r) => {
    const key = r.tableId || "unassigned";
    if (!byTable[key]) byTable[key] = { tableId: key, tableName: r.tableName, reservations: 0, totalPeople: 0, avgPartySize: 0 };
    byTable[key].reservations += 1;
    byTable[key].totalPeople += Number(r.people || 0);
  });

  const tables = Object.values(byTable).map((t) => ({
    ...t,
    avgPartySize: t.reservations ? Math.round(t.totalPeople / t.reservations) : 0,
  }));

  return { tables, totalTables: tables.length };
};

const getNoShowAnalytics = async (filters = {}, tenantId) => {
  const where = { resStatus: "no-show" };
  if (filters.from) where.resDate = { ...where.resDate, [Op.gte]: filters.from };
  if (filters.to) where.resDate = { ...where.resDate, [Op.lte]: filters.to };

  const noShows = await reservationDAO.findAllReservationsRaw(where, tenantId);
  const total = noShows.length;

  const byDay = {};
  noShows.forEach((r) => {
    if (!byDay[r.resDate]) byDay[r.resDate] = { date: r.resDate, count: 0 };
    byDay[r.resDate].count += 1;
  });

  const byTime = {};
  noShows.forEach((r) => {
    if (!byTime[r.resTime]) byTime[r.resTime] = { time: r.resTime, count: 0 };
    byTime[r.resTime].count += 1;
  });

  return { total, byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)), byTime: Object.values(byTime).sort((a, b) => a.time.localeCompare(b.time)) };
};

const getOrderAnalytics = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.orderedAt = { ...where.orderedAt, [Op.gte]: new Date(filters.from) };
  if (filters.to) where.orderedAt = { ...where.orderedAt, [Op.lte]: new Date(filters.to) };

  const result = await db.order.findOne({
    attributes: [
      [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"],
      [db.sequelize.fn("SUM", db.sequelize.col("total")), "totalRevenue"],
      [db.sequelize.fn("AVG", db.sequelize.col("total")), "avgOrderValue"],
    ],
    where: { ...where, tenantId },
    raw: true,
  });

  const statusBreakdown = await db.order.findAll({
    attributes: ["status", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]],
    where: { ...where, tenantId },
    group: ["status"],
    raw: true,
  });

  const paymentBreakdown = await db.order.findAll({
    attributes: ["paymentStatus", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]],
    where: { ...where, tenantId },
    group: ["paymentStatus"],
    raw: true,
  });

  return {
    totalOrders: parseInt(result?.totalOrders || 0),
    totalRevenue: parseFloat(result?.totalRevenue || 0),
    avgOrderValue: parseFloat(result?.avgOrderValue || 0),
    statusBreakdown: statusBreakdown.map((r) => ({ status: r.status, count: parseInt(r.count) })),
    paymentBreakdown: paymentBreakdown.map((r) => ({ status: r.paymentStatus, count: parseInt(r.count) })),
  };
};

const getTopSellingItems = async (filters = {}, tenantId) => {
  const where = {};
  if (filters.from) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(filters.from) };
  if (filters.to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(filters.to) };

  const items = await db.orderItem.findAll({
    include: [
      {
        model: db.order,
        where: { ...where, tenantId },
        attributes: [],
      },
      {
        model: db.menuItem,
        attributes: ["id", "name", "price"],
      },
    ],
    attributes: [
      "menuItemId",
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "totalQuantity"],
      [db.sequelize.fn("SUM", db.sequelize.col("lineTotal")), "totalRevenue"],
    ],
    group: ["menuItemId", "menuItem.id"],
    order: [[db.sequelize.fn("SUM", db.sequelize.col("quantity")), "DESC"]],
    limit: 20,
    raw: true,
  });

  return items.map((item) => ({
    menuItemId: item.menuItemId,
    name: item["menuItem.name"],
    price: parseFloat(item["menuItem.price"] || 0),
    totalQuantity: parseInt(item.totalQuantity || 0),
    totalRevenue: parseFloat(item.totalRevenue || 0),
  }));
};

const exportOrderCSV = async (filters = {}, tenantId) => {
  const { orders } = await orderDAO.getOrders(tenantId, filters, {});
  const header = ["Order ID", "Date", "Status", "Payment Status", "Customer", "Total", "Discount Code"];
  let csv = header.map(csvCell).join(",") + "\n";
  orders.forEach((o) => {
    csv +=
      [
        o.id,
        o.orderedAt ? new Date(o.orderedAt).toISOString().slice(0, 10) : "",
        o.status,
        o.paymentStatus,
        [o.Customer?.firstName, o.Customer?.lastName].filter(Boolean).join(" ") || "",
        o.total,
        o.discountCode || "",
      ]
        .map(csvCell)
        .join(",") + "\n";
  });
  return csv;
};

const exportOrderPDF = async (filters = {}, tenantId) => {
  const { orders } = await orderDAO.getOrders(tenantId, filters, {});
  const analytics = await getOrderAnalytics(filters, tenantId);

  const lines = [];
  lines.push("ORDER REPORT");
  lines.push("============");
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  const range =
    [filters.from, filters.to].filter(Boolean).join(" to ") || "All dates";
  lines.push(`Period: ${range}`);
  lines.push(`Total Orders: ${analytics.totalOrders}`);
  lines.push(`Total Revenue: GHS ${analytics.totalRevenue.toFixed(2)}`);
  lines.push(`Average Order Value: GHS ${analytics.avgOrderValue.toFixed(2)}`);
  lines.push("");
  lines.push("STATUS BREAKDOWN");
  analytics.statusBreakdown.forEach((s) => {
    lines.push(`  ${s.status}: ${s.count}`);
  });
  lines.push("");
  lines.push("PAYMENT BREAKDOWN");
  analytics.paymentBreakdown.forEach((s) => {
    lines.push(`  ${s.status}: ${s.count}`);
  });
  lines.push("");
  lines.push("ORDERS:");
  orders.forEach((o, i) => {
    lines.push(
      `${i + 1}. Order #${o.id} - ${new Date(o.orderedAt).toLocaleString()} - ${o.status} - GHS ${o.total}`
    );
  });

  return generateTextPdf(lines);
};

module.exports = {
  getReservationReport,
  getTurnTimeReport,
  exportCSV,
  exportPDF,
  getTimeSeriesReport,
  getCustomerAnalytics,
  getTableUtilization,
  getNoShowAnalytics,
  getOrderAnalytics,
  getTopSellingItems,
  exportOrderCSV,
  exportOrderPDF,
};
