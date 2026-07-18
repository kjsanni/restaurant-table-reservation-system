const axios = require("axios");
const authDAO = require("../DAOs/auth.dao");

const isSyncEnabled = async (tenantId) => {
  const config = await authDAO.getSettingValue(
    "pos_sync",
    { enabled: false, posApiUrl: "", posApiKey: "" },
    tenantId
  );
  return Boolean(config && config.enabled && config.posApiUrl && config.posApiKey);
};

const getSyncConfig = async (tenantId) => {
  const config = await authDAO.getSettingValue(
    "pos_sync",
    { enabled: false, posApiUrl: "", posApiKey: "" },
    tenantId
  );
  if (!config) return { enabled: false, posApiUrl: "", posApiKey: "" };
  return config;
};

const postToPos = async (event, payload, tenantId) => {
  try {
    const config = await getSyncConfig(tenantId);
    if (!config || !config.enabled || !config.posApiUrl || !config.posApiKey) {
      return;
    }

    const url = `${String(config.posApiUrl).replace(/\/$/, "")}/api/v1/sync/rtrs`;
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": String(config.posApiKey),
    };

    await axios.post(url, { event, payload, timestamp: new Date().toISOString() }, { headers, timeout: 5000 });
  } catch (err) {
    console.error(`Sync dispatch to POS failed for ${event}:`, err.message);
  }
};

const reservationSeated = async (reservation, tenantId) => {
  await postToPos("reservation.seated", {
    reservationId: reservation.id,
    tableId: reservation.tableId,
    partySize: reservation.people,
    guestName: `${reservation.firstName} ${reservation.lastName}`.trim(),
    resTime: reservation.resTime,
    resDate: reservation.resDate,
    customerPhone: reservation.customerPhone,
  }, tenantId);
};

const reservationCancelled = async (reservation, tenantId) => {
  await postToPos("reservation.cancelled", {
    reservationId: reservation.id,
    tableId: reservation.tableId,
  }, tenantId);
};

const paymentPaid = async (reservation, payment, tenantId) => {
  await postToPos("payment.paid", {
    reservationId: reservation.id,
    paymentId: payment.id,
    amount: payment.amount,
    method: payment.method,
    currency: payment.currency || "GHS",
  }, tenantId);
};

const tableUpdated = async (table, tenantId) => {
  await postToPos("table.updated", {
    tableId: table.id,
    name: table.name,
    capacity: table.capacity,
    status: table.isOccupied ? "occupied" : "free",
    mergedWith: table.linkedTableIds || null,
  }, tenantId);
};

module.exports = {
  isSyncEnabled,
  getSyncConfig,
  postToPos,
  reservationSeated,
  reservationCancelled,
  paymentPaid,
  tableUpdated,
};
