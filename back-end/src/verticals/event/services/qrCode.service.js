"use strict";

const crypto = require("crypto");
const db = require("../../../db/models");
const qrCodeDAO = require("../DAOs/qrCode.dao");
const guestListDAO = require("../DAOs/guestList.dao");
const cache = require("../../../utils/cache");

const QR_SCAN_RATE_LIMIT = 5;
const QR_SCAN_RATE_WINDOW_SEC = 1;
const DEVICE_BINDING_TTL = 4 * 60 * 60;
const RECENT_SCAN_CACHE_TTL = 60 * 7;

const logAudit = async (action, entityId, tenantId, userId, changes, entityType = "event_ticket") => {
  await db.AuditLog.create({
    action,
    entityType,
    entityId,
    tenantId,
    userId,
    changes,
  }).catch(() => {});
};

const loadQrSecret = async (tenantId) => {
  const setting = await db.setting.findOne({
    where: { key: "event_qr_secret", tenantId },
  });
  if (setting && setting.value) {
    return setting.value;
  }
  return process.env.EVENT_QR_SECRET || "dev-qr-secret-change-me";
};

const buildQrPayload = (tokenHash, eventId, tenantId, attendeeName, issuedAt) => {
  const payload = {
    t: tokenHash,
    e: eventId,
    n: attendeeName ? attendeeName.substring(0, 48) : undefined,
    i: issuedAt,
  };
  const json = JSON.stringify(payload);
  if (Buffer.byteLength(json, "utf8") > 480) {
    throw new Error("QR payload exceeds capacity — truncate attendee name");
  }
  return payload;
};

const signPayload = (payload, secret) => {
  const json = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(json).digest("hex");
};

const verifySignature = (rawToken, signature, secret) => {
  const expected = crypto.createHmac("sha256", secret).update(rawToken).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
};

const verifyPayload = (payload, signature, secret) => {
  const json = JSON.stringify(payload);
  const expected = crypto.createHmac("sha256", secret).update(json).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
};

const qrCodeService = {};

qrCodeService.getQRCodes = async (eventId, tenantId, filters = {}) => {
  return qrCodeDAO.list(eventId, tenantId, filters);
};

qrCodeService.generateQRCode = async (eventId, data, tenantId) => {
  const secret = await loadQrSecret(tenantId);
  const issuedAt = Date.now();

  const qrCodeData = {
    eventId,
    tenantId,
    attendeeName: data.attendeeName || null,
    photoRef: data.photoRef || null,
    seat: data.seat || null,
    tier: data.tier || null,
    ticketType: data.ticketType || null,
    maxUses: data.maxUses || 1,
    validFrom: data.validFrom ? new Date(data.validFrom) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    metadata: data.metadata || null,
    guestListId: data.guestListId || null,
  };

  const { record, rawToken, tokenHash } = await qrCodeDAO.create(qrCodeData);

  const signature = crypto.createHmac("sha256", secret).update(rawToken).digest("hex");

  const payload = buildQrPayload(
    tokenHash,
    eventId,
    tenantId,
    data.attendeeName,
    issuedAt
  );

  const payloadSignature = signPayload(payload, secret);
  const qrData = JSON.stringify({ token: rawToken, signature: payloadSignature });

  return {
    id: record.id,
    code: record.code,
    rawToken,
    tokenHash,
    signature,
    qrData,
    qrPayload: { payload, signature: payloadSignature },
    attendeeName: record.attendeeName,
    seat: record.seat,
    tier: record.tier,
    expiresAt: record.expiresAt,
    maxUses: record.maxUses,
  };
};

qrCodeService.generateBatchQRCodes = async (eventId, count, data, tenantId) => {
  const results = [];

  for (let i = 0; i < count; i++) {
    const attendeeName = data.attendeeNames
      ? data.attendeeNames[i] || `Attendee ${i + 1}`
      : data.attendeeName || `Attendee ${i + 1}`;

    const itemData = { ...data, attendeeName };
    const generated = await qrCodeService.generateQRCode(eventId, itemData, tenantId);
    results.push(generated);
  }

  return results;
};

const checkScanRateLimit = async (tokenHash) => {
  const key = `scan_ratelimit:${tokenHash}`;
  const current = await cache.get(key);
  if (current !== null && current >= QR_SCAN_RATE_LIMIT) {
    return false;
  }
  await cache.set(key, (current || 0) + 1, QR_SCAN_RATE_WINDOW_SEC);
  return true;
};

const checkDeviceBinding = async (tokenHash, scannerId) => {
  const key = `scan_device:${tokenHash}`;
  const existing = await cache.get(key);
  if (existing && existing !== scannerId) {
    return false;
  }
  await cache.set(key, scannerId, DEVICE_BINDING_TTL);
  return true;
};

qrCodeService.checkin = async (rawToken, tenantId, userId, scannerParams = {}) => {
  const { scannerId, latitude, longitude, signature: sig } = scannerParams;

  if (!rawToken || typeof rawToken !== "string" || rawToken.length !== 64) {
    await logAudit(
      "qr_checkin_failure",
      null,
      tenantId,
      userId,
      { reason: "invalid_token_format" }
    );
    return { valid: false, error: "INVALID_TOKEN", message: "Invalid QR code format" };
  }

  if (sig && typeof sig === "string" && sig.length > 0) {
    const secret = await loadQrSecret(tenantId);
    if (!verifySignature(rawToken, sig, secret)) {
      await logAudit(
        "qr_checkin_failure",
        null,
        tenantId,
        userId,
        { reason: "invalid_signature", tokenHash: qrCodeDAO.hashToken(rawToken).substring(0, 8) + "..." }
      );
      return { valid: false, error: "INVALID_SIGNATURE", message: "Invalid QR signature" };
    }
  }

  const tokenHash = qrCodeDAO.hashToken(rawToken);

  if (!(await checkScanRateLimit(tokenHash))) {
    await logAudit(
      "qr_checkin_failure",
      null,
      tenantId,
      userId,
      { reason: "rate_limited", tokenHash: tokenHash.substring(0, 8) + "..." }
    );
    return { valid: false, error: "RATE_LIMITED", message: "Too many scan attempts. Please wait." };
  }

  if (scannerId) {
    if (!(await checkDeviceBinding(tokenHash, scannerId))) {
      await logAudit(
        "qr_checkin_failure",
        null,
        tenantId,
        userId,
        { reason: "device_binding_mismatch", tokenHash: tokenHash.substring(0, 8) + "..." }
      );
      return { valid: false, error: "DEVICE_MISMATCH", message: "Ticket already scanned at a different gate" };
    }
  }

  const recentKey = `scan_recent:${tokenHash}`;
  const recentlyScanned = await cache.get(recentKey);
  if (recentlyScanned) {
    return { valid: false, error: "ALREADY_USED", message: "QR code already used" };
  }

  if (latitude && longitude) {
    const existing = await db.QRCode.findOne({
      where: { tokenHash },
      attributes: ["eventId"],
    });
    if (existing && existing.eventId) {
      const event = await db.Event.findOne({
        where: { id: existing.eventId, ...(tenantId ? { tenantId } : {}) },
        attributes: ["venueLatitude", "venueLongitude"],
      });
      if (event && event.venueLatitude && event.venueLongitude) {
        const R = 6371000;
        const dLat = (latitude - event.venueLatitude) * Math.PI / 180;
        const dLon = (longitude - event.venueLongitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(event.venueLatitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const d = 2 * R * Math.asin(Math.sqrt(a));
        if (d > 50) {
          await logAudit(
            "qr_checkin_failure",
            null,
            tenantId,
            userId,
            { reason: "geofence_exceeded", tokenHash: tokenHash.substring(0, 8) + "...", distance: Math.round(d) }
          );
          return { valid: false, error: "GEOFENCE_EXCEEDED", message: "Scanner is too far from venue" };
        }
      }
    }
  }

  const result = await qrCodeDAO.markUsedAtomic(tokenHash, tenantId, userId);

  if (result === null) {
    await logAudit(
      "qr_checkin_failure",
      null,
      tenantId,
      userId,
      { reason: "token_not_found", tokenHash: tokenHash.substring(0, 8) + "..." }
    );
    return { valid: false, error: "INVALID_TOKEN", message: "Invalid or expired QR code" };
  }

  if (result.locked) {
    return { valid: false, error: "CONCURRENT_SCAN", message: "Please try again" };
  }

  if (result.alreadyUsed) {
    await cache.set(recentKey, true, RECENT_SCAN_CACHE_TTL);
    await logAudit(
      "qr_checkin_failure",
      result.id,
      tenantId,
      userId,
      { tokenHash: tokenHash.substring(0, 8) + "..." }
    );
    return { valid: false, error: "ALREADY_USED", message: "QR code already used" };
  }

  if (result.expired) {
    return { valid: false, error: "EXPIRED", message: "QR code has expired" };
  }

  if (result.notYetValid) {
    return { valid: false, error: "NOT_YET_VALID", message: "QR code not yet valid" };
  }

  await cache.set(recentKey, true, RECENT_SCAN_CACHE_TTL);

  if (result.guestListId) {
    await guestListDAO.update(result.guestListId, result.eventId, tenantId, {
      status: "checked_in",
      checkedInAt: new Date(),
      checkedInById: userId,
    });
  }

  return {
    valid: true,
    admitted: true,
    item: {
      id: result.id,
      attendeeName: result.attendeeName,
      seat: result.seat,
      tier: result.tier,
      ticketType: result.ticketType,
      checkedInAt: result.checkedInAt,
      usedCount: result.usedCount,
      maxUses: result.maxUses,
    },
  };
};

qrCodeService.verifyToken = async (rawToken, tenantId) => {
  const tokenHash = qrCodeDAO.hashToken(rawToken);
  return qrCodeDAO.findByTokenHash(tokenHash, tenantId);
};

qrCodeService.buildQrPayload = buildQrPayload;
qrCodeService.signPayload = signPayload;
qrCodeService.verifyPayload = verifyPayload;
qrCodeService.verifySignature = verifySignature;
qrCodeService.loadQrSecret = loadQrSecret;

const loadScannerConfig = async (tenantId) => {
  const setting = await db.setting.findOne({
    where: { key: "event_checkin_config", tenantId },
  });
  if (setting && setting.value) {
    return setting.value;
  }
  return { scannerApiKey: null, geofenceRadiusMeters: 50, scanRateLimit: 5 };
};

qrCodeService.getScannerConfig = async (tenantId) => {
  const config = await loadScannerConfig(tenantId);
  return {
    scannerApiKey: config.scannerApiKey || null,
    geofenceRadiusMeters: config.geofenceRadiusMeters || 50,
    scanRateLimit: config.scanRateLimit || 5,
  };
};

module.exports = qrCodeService;
