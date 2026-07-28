const axios = require("axios");
const authDAO = require("../DAOs/auth.dao");
const { URL } = require("url");

const ALLOWED_SCHEMES = new Set(["http", "https"]);
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIp(host) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function validateSyncUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw));
  } catch {
    return false;
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol.replace(":", ""))) return false;
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) return false;
  if (isPrivateIp(hostname)) return false;
  return true;
}

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
    if (!validateSyncUrl(url)) {
      console.error(`Sync dispatch blocked for invalid POS URL: ${config.posApiUrl}`);
      return;
    }
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
