const platformAuditDAO = require("../DAOs/platformAudit.dao");

const listPlatformAuditHandler = async (req, res) => {
  const { action, tenantId, actorUserId, limit } = req.query;
  const data = await platformAuditDAO.list({
    action,
    tenantId: tenantId ? parseInt(tenantId, 10) : null,
    actorUserId: actorUserId ? parseInt(actorUserId, 10) : null,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, collection: data });
};

module.exports = { listPlatformAuditHandler };
