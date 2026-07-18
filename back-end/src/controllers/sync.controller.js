const crypto = require("crypto");
const authDAO = require("../DAOs/auth.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const tableDAO = require("../DAOs/table.dao");
const db = require("../db/models");
const syncService = require("../services/sync.service");

const validateSyncApiKey = async (req) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return { error: { status: 401, message: "Missing X-API-Key" } };
  }

  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return { error: { status: 400, message: "Missing tenant context" } };
  }

  const config = await authDAO.getSettingValue(
    "pos_sync",
    { enabled: false, posApiUrl: "", posApiKey: "" },
    tenantId
  );

  if (!config || !config.posApiKey) {
    return { error: { status: 403, message: "POS sync not configured for tenant" } };
  }

  const storedKey = String(config.posApiKey);
  const providedKey = String(apiKey);

  let matches = false;
  try {
    matches =
      providedKey.length === storedKey.length &&
      crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(storedKey));
  } catch {
    matches = false;
  }

  if (!matches) {
    return { error: { status: 403, message: "Invalid X-API-Key" } };
  }

  return { tenantId };
};

const listTablesHandler = async (req, res) => {
  const validation = await validateSyncApiKey(req);
  if (validation.error) {
    return res.status(validation.error.status).json({ success: false, message: validation.error.message });
  }

  const tables = await tableDAO.getAllTables(validation.tenantId);
  return res.status(200).json({ success: true, data: tables });
};

const listReservationsHandler = async (req, res) => {
  const validation = await validateSyncApiKey(req);
  if (validation.error) {
    return res.status(validation.error.status).json({ success: false, message: validation.error.message });
  }

  const date = req.query.date || new Date().toISOString().split("T")[0];
  const reservations = await reservationDAO.findAllReservationsRaw(
    { resDate: date },
    validation.tenantId
  );
  return res.status(200).json({ success: true, data: reservations });
};

const paymentSettledHandler = async (req, res) => {
  const validation = await validateSyncApiKey(req);
  if (validation.error) {
    return res.status(validation.error.status).json({ success: false, message: validation.error.message });
  }

  const { reservationId, amount, method, currency, paymentId } = req.body;

  const reservation = await reservationDAO.findReservationById(reservationId, validation.tenantId);
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
    tenantId: validation.tenantId,
  });

  const updated = await reservationDAO.updateReservation(reservationId, {
    paymentStatus: "paid",
    resStatus: "completed",
  }, validation.tenantId);

  return res.status(200).json({ success: true, reservation: updated, payment });
};

const reservationSeatedHandler = async (req, res) => {
  const validation = await validateSyncApiKey(req);
  if (validation.error) {
    return res.status(validation.error.status).json({ success: false, message: validation.error.message });
  }

  const { reservationId, tableId } = req.body;

  const reservation = await reservationDAO.findReservationById(reservationId, validation.tenantId);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  const updated = await reservationDAO.updateReservation(reservationId, {
    resStatus: "seated",
    tableId,
  }, validation.tenantId);

  return res.status(200).json({ success: true, reservation: updated });
};

module.exports = {
  listTablesHandler,
  listReservationsHandler,
  paymentSettledHandler,
  reservationSeatedHandler,
};
