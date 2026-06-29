const db = require("../db/models");
const AuditLog = db.auditLog;

const createLog = async ({ action, entityType, entityId, userId, changes, ipAddress }) => {
  return await AuditLog.create({
    action,
    entityType,
    entityId,
    userId,
    changes,
    ipAddress,
  });
};

const getAllLogs = async () => {
  return await AuditLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
};

module.exports = {
  createLog,
  getAllLogs,
};