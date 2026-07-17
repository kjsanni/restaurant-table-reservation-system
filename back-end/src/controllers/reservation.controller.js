const reservationService = require("../services/reservationService");
const reservationDAO = require("../DAOs/reservation.dao");
const tableDAO = require("../DAOs/table.dao");
const paymentDAO = require("../DAOs/payment.dao");

// Fields a client is permitted to update on a reservation. Any other key in the
// request body is stripped to prevent mass-assignment of status/payment totals.
const EDITABLE_RESERVATION_FIELDS = [
  "resDate",
  "resTime",
  "people",
  "notes",
  "customerName",
  "customerEmail",
  "customerPhone",
  "expectedTotal",
  "paymentStatus",
  "resStatus",
];

const pickEditableFields = (source) => {
  const picked = {};
  for (const key of EDITABLE_RESERVATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      picked[key] = source[key];
    }
  }
  return picked;
};

const getAllHandler = async (req, res) => {
  const filters = {};
  if (req.query.q) filters.q = req.query.q;
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.status) filters.status = req.query.status;

  const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
  const pagination = {};
  if (page && pageSize) {
    pagination.limit = pageSize;
    pagination.offset = (page - 1) * pageSize;
  }

  const result = await reservationService.getAllReservations(
    reservationDAO,
    filters,
    pagination
  );

  const response = { success: true };
  if (result && result.reservations !== undefined) {
    response.collection = result.reservations;
    response.total = result.total;
    response.page = page;
    response.pageSize = pageSize;
  } else {
    response.collection = result;
  }

  return res.status(200).json(response);
};

const registerHandler = async (req, res) => {
  const payload = req.body;
  await reservationService.registerReservation(
    reservationDAO,
    payload
  );

  return res.status(201).json({
    success: true,
    message: "Successfully registered the reservation!",
  });
};

const editHandler = async (req, res) => {
  const payload = pickEditableFields(req.body);
  const reservationId = req.params.reservationId;
  const reservation = await reservationService.editReservation(
    reservationId,
    reservationDAO,
    payload
  );

  return res.status(200).json({
    success: true,
    message: "Successfully updated the reservation!",
    item: reservation,
  });
};

const getOneHandler = async (req, res) => {
  const reservationId = req.params.reservationId;
  const reservation = await reservationDAO.findReservationById(reservationId);
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: "Reservation not found!",
    });
  }
  return res.status(200).json({
    success: true,
    item: reservation,
  });
};

const cancelHandler = async (req, res) => {
  const reservationId = req.params.reservationId;
  const reservation = await reservationService.cancelReservation(
    reservationId,
    reservationDAO
  );

  return res.status(200).json({
    success: true,
    message: "Successfully canceled the reservation!",
    item: reservation,
  });
};

const chooseTableHandler = async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const { tableId } = req.body;

    const info = await reservationService.chooseTable(
      reservationId,
      tableId,
      reservationDAO,
      tableDAO
    );

    return res.status(200).json({
      success: true,
      message: "Successfully chosen your table!",
      item: info,
    });
  } catch (err) {
    const status = err?.status || 400;
    return res.status(status).json({
      success: false,
      message: err?.message || "Failed to assign table.",
    });
  }
};

const getHeatmapHandler = async (req, res) => {
  const heatmap = await reservationDAO.getReservationsHeatmap();
  return res.status(200).json({
    success: true,
    heatmap,
  });
};

const bulkCancelHandler = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid reservation IDs provided.",
    });
  }

  const results = await reservationDAO.bulkCancel(ids);
  return res.status(200).json({
    success: true,
    message: `Canceled ${results.count} reservations`,
    count: results.count,
  });
};

const bulkUpdateHandler = async (req, res) => {
  const { ids, updates } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid reservation IDs provided.",
    });
  }

  if (!updates || typeof updates !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid update payload.",
    });
  }

  const safeUpdates = pickEditableFields(updates);
  if (Object.keys(safeUpdates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No allowed fields provided for update.",
    });
  }

  const results = await reservationDAO.bulkUpdate(ids, safeUpdates);
  return res.status(200).json({
    success: true,
    message: `Updated ${results.count} reservations`,
    count: results.count,
  });
};

const getAssignedStaffHandler = async (req, res) => {
  const { reservationId } = req.params;
  const staff = await reservationDAO.getAssignedStaff(reservationId);
  return res.status(200).json({
    success: true,
    staff,
  });
};

const assignStaffHandler = async (req, res) => {
  const { reservationId } = req.params;
  const { userId } = req.body;
  const result = await reservationDAO.assignStaff(reservationId, userId);
  if (!result) {
    return res.status(404).json({
      success: false,
      message: "Reservation or user not found!",
    });
  }
  return res.status(200).json({
    success: true,
    message: "Staff assigned successfully!",
    assignment: result,
  });
};

const unassignStaffHandler = async (req, res) => {
  const { reservationId, userId } = req.params;
  const result = await reservationDAO.unassignStaff(reservationId, userId);
  if (!result) {
    return res.status(404).json({
      success: false,
      message: "Reservation or user not found!",
    });
  }
  return res.status(200).json({
    success: true,
    message: "Staff unassigned successfully!",
  });
};

const getPaymentSummaryHandler = async (req, res) => {
  const summary = await reservationDAO.getPaymentStatusCounts();
  return res.status(200).json({
    success: true,
    summary,
  });
};

const getStatsHandler = async (req, res) => {
  const filters = {};
  if (req.query.from) filters.from = req.query.from;
  if (req.query.to) filters.to = req.query.to;
  if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
  if (req.query.resStatus) filters.resStatus = req.query.resStatus;

  const stats = await reservationDAO.getReservationStats(filters);
  return res.status(200).json({
    success: true,
    stats,
  });
};

const getHeatmapV2Handler = async (req, res) => {
  const { mode = "date-hour", from, to } = req.query;

  if (!["date-hour", "calendar"].includes(mode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid mode. Use 'date-hour' or 'calendar'.",
    });
  }

  if (from && isNaN(Date.parse(from))) {
    return res.status(400).json({
      success: false,
      message: "Invalid 'from' date. Use YYYY-MM-DD format.",
    });
  }

  if (to && isNaN(Date.parse(to))) {
    return res.status(400).json({
      success: false,
      message: "Invalid 'to' date. Use YYYY-MM-DD format.",
    });
  }

  if (from && to && new Date(from) > new Date(to)) {
    return res.status(400).json({
      success: false,
      message: "'from' date cannot be after 'to' date.",
    });
  }

  const result = await reservationDAO.getHeatmapV2(from, to, mode);
  return res.status(200).json({
    success: true,
    ...result,
  });
};

const searchHandler = async (req, res) => {
  const query = req.query.q || "";
  const results = await reservationService.searchReservations(reservationDAO, query);
  return res.status(200).json({
    success: true,
    results,
  });
};

const getRecurringHandler = async (req, res) => {
  const customerId = req.query.customerId;
  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: "customerId is required.",
    });
  }
  const results = await reservationService.getRecurringReservations(reservationDAO, customerId);
  return res.status(200).json({
    success: true,
    collection: results,
  });
};

const getStatusHistoryHandler = async (req, res) => {
  const { reservationId } = req.params;
  const history = await reservationService.getStatusHistory(reservationId);
  return res.status(200).json({ success: true, history });
};

const mergeTablesHandler = async (req, res) => {
  const { reservationId } = req.params;
  const { tableIds } = req.body;
  const reservation = await reservationService.mergeReservationTables(reservationDAO, reservationId, tableIds);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }
  return res.status(200).json({ success: true, message: "Tables merged", reservation });
};

const unmergeTablesHandler = async (req, res) => {
  const { reservationId } = req.params;
  const reservation = await reservationService.unmergeReservationTables(reservationDAO, reservationId);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }
  return res.status(200).json({ success: true, message: "Tables unmerged", reservation });
};

const getRevenueTimeSeriesHandler = async (req, res) => {
  const { from, to, granularity } = req.query;
  const validGranularities = ["day", "week", "month"];
  if (!validGranularities.includes(granularity)) {
    return res.status(400).json({
      success: false,
      message: "Invalid granularity. Use 'day', 'week', or 'month'.",
    });
  }
  const data = await reservationService.getRevenueTimeSeries(from, to, granularity);
  return res.status(200).json({ success: true, ...data });
};

const searchNotesHandler = async (req, res) => {
  const { q: query } = req.query;
  const results = await reservationDAO.searchReservationsByNotes(query || "");
  return res.status(200).json({
    success: true,
    collection: results,
  });
};

module.exports = {
  getAllHandler,
  registerHandler,
  editHandler,
  getOneHandler,
  cancelHandler,
  chooseTableHandler,
  getHeatmapHandler,
  getHeatmapV2Handler,
  bulkCancelHandler,
  bulkUpdateHandler,
  getAssignedStaffHandler,
  assignStaffHandler,
  unassignStaffHandler,
  getPaymentSummaryHandler,
  getStatsHandler,
  searchHandler,
  getRecurringHandler,
  getStatusHistoryHandler,
  mergeTablesHandler,
  unmergeTablesHandler,
  getRevenueTimeSeriesHandler,
  searchNotesHandler,
};