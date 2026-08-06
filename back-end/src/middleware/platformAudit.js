const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const platformAudit = (action, resourceType) => {
  return async (req, res, next) => {
    try {
      const actorUserId = req.user?.id || null;
      const tenantId = req.tenant?.id || null;
      const entityId = req.params?.id || null;

      const metadata = {
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get("user-agent") || null,
        method: req.method,
        url: req.originalUrl,
      };

      await platformAuditDAO.log(actorUserId, action, resourceType, entityId, tenantId, metadata, metadata.ipAddress);
    } catch (err) {
      console.error("Platform audit logging failed:", err.message);
    }

    next();
  };
};

module.exports = platformAudit;
