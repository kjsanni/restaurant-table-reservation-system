"use strict";

const platformAuditDAO = require("../DAOs/platformAudit.dao");

const auditLog = (req, action, resourceType, entityId, metadata = {}, options = {}) => {
  const actorUserId = options.actorUserId ?? req.user?.id ?? null;
  const tenantId = options.tenantId ?? req.tenant?.id ?? null;
  const ipAddress = options.ipAddress ?? req.ip;
  return platformAuditDAO.log(actorUserId, action, resourceType, entityId, tenantId, metadata, ipAddress);
};

module.exports = auditLog;
