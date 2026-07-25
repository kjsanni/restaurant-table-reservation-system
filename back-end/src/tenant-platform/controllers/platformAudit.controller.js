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

const recentActivityHandler = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const data = await platformAuditDAO.list({ limit });
  const formatted = data.map((entry) => {
    const meta = entry.metadata || {};
    return {
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      tenantId: entry.tenantId,
      actorUserId: entry.actorUserId,
      ipAddress: entry.ipAddress,
      createdAt: entry.createdAt,
      title: meta.title || entry.action,
      detail: meta.detail || "",
      tenantName: meta.tenantName || null,
    };
  });
  res.status(200).json({ success: true, collection: formatted });
};

module.exports = { listPlatformAuditHandler, recentActivityHandler };
