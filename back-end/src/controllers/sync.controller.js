const authDAO = require("../DAOs/auth.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const tableDAO = require("../DAOs/table.dao");
const db = require("../db/models");
const syncService = require("../services/sync.service");

const listTablesHandler = async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: "Missing X-API-Key" });
  }

  const tenantId = req.tenant?.id;
  const tables = await tableDAO.getAllTables(tenantId);
  return res.status(200).json({ success: true, data: tables });
};

const listReservationsHandler = async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: "Missing X-API-Key" });
  }

  const tenantId = req.tenant?.id;
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const reservations = await reservationDAO.findAllReservationsRaw(
    { resDate: date },
    tenantId
  );
  return res.status(200).json({ success: true, data: reservations });
};

const paymentSettledHandler = async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: "Missing X-API-Key" });
  }

  const tenantId = req.tenant?.id;
  const { reservationId, amount, method, currency, paymentId } = req.body;

  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  const payment = await db.payment.create({
    reservationId,
    amount: Number(amount),
    method,
    currency: currency || "GHS",
    paymentStatus: "paid",
    paidAt: new Date(),
    tenantId,
  });

  const updated = await reservationDAO.updateReservation(reservationId, {
    paymentStatus: "paid",
    resStatus: "completed",
  }, tenantId);

  return res.status(200).json({ success: true, reservation: updated, payment });
};

const reservationSeatedHandler = async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ success: false, message: "Missing X-API-Key" });
  }

  const tenantId = req.tenant?.id;
  const { reservationId, tableId } = req.body;

  const reservation = await reservationDAO.findReservationById(reservationId, tenantId);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  const updated = await reservationDAO.updateReservation(reservationId, {
    resStatus: "seated",
    tableId,
  }, tenantId);

  return res.status(200).json({ success: true, reservation: updated });
};

module.exports = {
  listTablesHandler,
  listReservationsHandler,
  paymentSettledHandler,
  reservationSeatedHandler,
};
