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

const listForUserHandler = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { action, startDate, endDate, limit, offset } = req.query;
  const data = await platformAuditDAO.findAllForUser(userId, {
    action,
    startDate,
    endDate,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.status(200).json({ success: true, collection: data });
};

const listForTenantHandler = async (req, res) => {
  const tenantId = parseInt(req.params.tenantId, 10);
  const { action, startDate, endDate, limit, offset } = req.query;
  const data = await platformAuditDAO.findAllForTenant(tenantId, {
    action,
    startDate,
    endDate,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.status(200).json({ success: true, collection: data });
};

const suspiciousActivityHandler = async (req, res) => {
  const { startDate, endDate, limit } = req.query;
  const data = await platformAuditDAO.findSuspicious({
    startDate,
    endDate,
    limit: limit ? parseInt(limit, 10) : 100,
  });
  res.status(200).json({ success: true, suspicious: data });
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

const exportAuditLogHandler = async (req, res) => {
  const { action, tenantId, actorUserId, format } = req.query;
  const data = await platformAuditDAO.list({
    action,
    tenantId: tenantId ? parseInt(tenantId, 10) : null,
    actorUserId: actorUserId ? parseInt(actorUserId, 10) : null,
    limit: 1000,
  });

  if (format === "csv") {
    const header = "ID,Action,Entity Type,Entity ID,Tenant ID,Actor User ID,IP Address,Created At\n";
    const rows = data
      .map((entry) => {
        const meta = entry.metadata || {};
        const title = (meta.title || entry.action).replace(/"/g, '""');
        const detail = (meta.detail || "").replace(/"/g, '""');
        return [
          entry.id,
          entry.action,
          entry.entityType || "",
          entry.entityId || "",
          entry.tenantId || "",
          entry.actorUserId || "",
          entry.ipAddress || "",
          new Date(entry.createdAt).toISOString(),
          title,
          detail,
        ].map((v) => `"${v}"`).join(",");
      })
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-log.csv");
    return res.send(header + rows);
  }

  res.status(200).json({ success: true, collection: data });
};

module.exports = {
  listPlatformAuditHandler,
  listForUserHandler,
  listForTenantHandler,
  suspiciousActivityHandler,
  recentActivityHandler,
  exportAuditLogHandler,
};
