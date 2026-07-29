const db = require("../../db/models");
const { fireWebhook } = require("../services/webhookNotification.service");

const platformAuditDAO = {};

platformAuditDAO.log = (actorUserId, action, entityType, entityId, tenantId, metadata = {}, ipAddress = null) => {
  const payload = { actorUserId, action, entityType, entityId, tenantId, metadata, ipAddress };
  const record = db.platformAuditLog.create(payload);

  fireWebhook("platform.audit.created", payload, tenantId).catch(() => {});

  return record;
};

platformAuditDAO.list = (filters = {}) => {
  const where = {};
  if (filters.actorUserId) where.actorUserId = filters.actorUserId;
  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;

  return db.platformAuditLog.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

platformAuditDAO.findRecent = (action, limit = 5) => {
  return db.platformAuditLog.findAll({
    where: { action },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

module.exports = platformAuditDAO;
