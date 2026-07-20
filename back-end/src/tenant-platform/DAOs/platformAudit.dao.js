const db = require("../../db/models");

const platformAuditDAO = {};

platformAuditDAO.log = (actorUserId, action, entityType, entityId, tenantId, metadata = {}, ipAddress = null) => {
  return db.platformAuditLog.create({ actorUserId, action, entityType, entityId, tenantId, metadata, ipAddress });
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

module.exports = platformAuditDAO;
