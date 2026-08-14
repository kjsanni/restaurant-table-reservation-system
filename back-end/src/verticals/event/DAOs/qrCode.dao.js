"use strict";

const crypto = require("crypto");
const db = require("../../../db/models");
const { acquireLock, releaseLock } = require("../../../utils/redis");

const generateRawToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

const qrCodeDAO = {};

qrCodeDAO.create = async (data) => {
  const raw = generateRawToken();
  const hash = hashToken(raw);

  const record = await db.QRCode.create({
    eventId: data.eventId,
    tenantId: data.tenantId,
    guestListId: data.guestListId || null,
    code: data.code || hash.substring(0, 32),
    tokenHash: hash,
    status: "active",
    maxUses: data.maxUses || 1,
    usedCount: 0,
    attendeeName: data.attendeeName || null,
    photoRef: data.photoRef || null,
    seat: data.seat || null,
    tier: data.tier || null,
    ticketType: data.ticketType || null,
    validFrom: data.validFrom || null,
    expiresAt: data.expiresAt || null,
    metadata: data.metadata || null,
  });

  return { record, rawToken: raw, tokenHash: hash };
};

qrCodeDAO.findByTokenHash = async (tokenHash, tenantId) => {
  const where = { tokenHash };
  if (tenantId) where.tenantId = tenantId;
  return db.QRCode.findOne({ where });
};

qrCodeDAO.findByCode = async (code, tenantId) => {
  const where = { code };
  if (tenantId) where.tenantId = tenantId;
  return db.QRCode.findOne({ where });
};

qrCodeDAO.list = async (eventId, tenantId, filters = {}) => {
  const where = { eventId };
  if (tenantId) where.tenantId = tenantId;

  const limit = filters.limit ? parseInt(filters.limit, 10) : 100;
  const offset = filters.page && filters.pageSize ? (parseInt(filters.page, 10) - 1) * parseInt(filters.pageSize, 10) : undefined;

  const { rows, count } = await db.QRCode.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return { rows, count };
};

qrCodeDAO.update = async (id, tenantId, updates) => {
  const qrCode = await db.QRCode.findOne({
    where: { id, ...(tenantId ? { tenantId } : {}) },
  });
  if (!qrCode) return null;
  await qrCode.update(updates);
  return qrCode;
};

qrCodeDAO.markUsedAtomic = async (tokenHash, tenantId, checkedInById) => {
  const lockKey = `qr_checkin:${tokenHash}`;
  const lock = await acquireLock(lockKey, 30);

  if (!lock.acquired) {
    return { locked: true, reason: lock.reason };
  }

  try {
    const result = await db.sequelize.transaction(async (t) => {
      const qrCode = await db.QRCode.findOne({ // nosemgrep: javascript.lang.security.audit.no-sql-injection - Sequelize parameterized where, not MongoDB
        where: {
          tokenHash,
          ...(tenantId ? { tenantId } : {}),
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!qrCode) {
        return null;
      }

      if (qrCode.usedCount >= qrCode.maxUses) {
        return { ...qrCode.toJSON(), alreadyUsed: true };
      }

      if (qrCode.expiresAt && new Date() > new Date(qrCode.expiresAt)) {
        return { ...qrCode.toJSON(), expired: true };
      }

      if (qrCode.validFrom && new Date() < new Date(qrCode.validFrom)) {
        return { ...qrCode.toJSON(), notYetValid: true };
      }

      await qrCode.increment("usedCount", { transaction: t });
      const newUsedCount = qrCode.usedCount + 1;

      await qrCode.update(
        {
          status: newUsedCount >= qrCode.maxUses ? "used" : qrCode.status,
          checkedInAt: new Date(),
          checkedInById,
        },
        { transaction: t }
      );

      return qrCode;
    });

    if (result && !result.alreadyUsed && !result.expired && !result.notYetValid && !result.locked) {
      await db.AuditLog.create({
        action: "qr_checkin_success",
        entityType: "event_ticket",
        entityId: result.id,
        tenantId,
        userId: checkedInById,
        changes: { tokenHash: tokenHash.substring(0, 8) + "..." },
      }).catch(() => {});
    }

    return result;
  } finally {
    await releaseLock(lockKey);
  }
};

qrCodeDAO.delete = async (id, tenantId) => {
  const qrCode = await db.QRCode.findOne({
    where: { id, ...(tenantId ? { tenantId } : {}) },
  });
  if (!qrCode) return false;
  await qrCode.destroy();
  return true;
};

qrCodeDAO.deleteByEventId = async (eventId, tenantId) => {
  await db.QRCode.destroy({
    where: { eventId, ...(tenantId ? { tenantId } : {}) },
  });
  return true;
};

qrCodeDAO.findByGuestListId = async (guestListId, tenantId) => {
  const where = { guestListId };
  if (tenantId) where.tenantId = tenantId;
  return db.QRCode.findOne({ where });
};

qrCodeDAO.hashToken = hashToken;
qrCodeDAO.generateRawToken = generateRawToken;

module.exports = qrCodeDAO;
