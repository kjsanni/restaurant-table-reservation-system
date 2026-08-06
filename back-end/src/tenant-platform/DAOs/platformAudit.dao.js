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

platformAuditDAO.findAllForUser = (actorUserId, filters = {}) => {
  const where = { actorUserId };
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate) where.createdAt = { [db.Sequelize.Op.gte]: filters.startDate };
  if (filters.endDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: filters.endDate };

  return db.platformAuditLog.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
    offset: filters.offset || 0,
  });
};

platformAuditDAO.findAllForTenant = (tenantId, filters = {}) => {
  const where = { tenantId };
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate) where.createdAt = { [db.Sequelize.Op.gte]: filters.startDate };
  if (filters.endDate) where.createdAt = { ...where.createdAt, [db.Sequelize.Op.lte]: filters.endDate };

  return db.platformAuditLog.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
    offset: filters.offset || 0,
  });
};

platformAuditDAO.findSuspicious = (filters = {}) => {
  const suspiciousActions = [
    "platform_role.assign",
    "platform_role.revoke",
    "tenant.create",
    "tenant.update",
    "tenant.delete",
    "billing.update",
    "compliance.update",
    "break_glass.request",
    "break_glass.approve",
    "break_glass.revoke",
  ];

  const where = { action: { [db.Sequelize.Op.in]: suspiciousActions } };
  if (filters.startDate) where.createdAt = { [db.Sequelize.Op.gte]: filters.startDate };
  if (filters.endDate) where.createdAt = { [db.Sequelize.Op.lte]: filters.endDate };

  return db.platformAuditLog.findAll({
    where,
    include: [
      {
        model: db.user,
        as: "actor",
        attributes: ["id", "username", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: filters.limit || 100,
  });
};

module.exports = platformAuditDAO;
