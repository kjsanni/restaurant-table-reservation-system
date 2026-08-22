const platformAuditDAO = require("../DAOs/platformAudit.dao");

const parseIntQuery = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const buildAuditFilters = (query, extra = {}) => {
  const filters = {};
  if (query.action) filters.action = query.action;
  if (query.tenantId) filters.tenantId = parseIntQuery(query.tenantId, null);
  if (query.actorUserId) filters.actorUserId = parseIntQuery(query.actorUserId, null);
  if (query.startDate) filters.startDate = query.startDate;
  if (query.endDate) filters.endDate = query.endDate;
  if (query.limit) filters.limit = parseIntQuery(query.limit, 100);
  if (query.pageSize) filters.pageSize = parseIntQuery(query.pageSize, 100);
  if (query.offset) {
    filters.offset = parseIntQuery(query.offset, 0);
  } else if (query.page) {
    const size = filters.pageSize || filters.limit || 100;
    filters.offset = (parseIntQuery(query.page, 1) - 1) * size;
  }
  if (filters.pageSize) filters.limit = filters.pageSize;
  return { ...filters, ...extra };
};

const formatAuditEntry = (entry) => {
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
};

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const listPlatformAuditHandler = async (req, res) => {
  const filters = buildAuditFilters(req.query);
  const data = await platformAuditDAO.list(filters);
  const total = await platformAuditDAO.count(filters);
  res.status(200).json({ success: true, collection: data, total });
};

const listForUserHandler = async (req, res) => {
  const userId = parseIntQuery(req.params.userId, 0);
  const data = await platformAuditDAO.findAllForUser(userId, buildAuditFilters(req.query));
  res.status(200).json({ success: true, collection: data });
};

const listForTenantHandler = async (req, res) => {
  const tenantId = parseIntQuery(req.params.tenantId, 0);
  const data = await platformAuditDAO.findAllForTenant(tenantId, buildAuditFilters(req.query));
  res.status(200).json({ success: true, collection: data });
};

const suspiciousActivityHandler = async (req, res) => {
  const data = await platformAuditDAO.findSuspicious(buildAuditFilters(req.query));
  res.status(200).json({ success: true, suspicious: data });
};

const recentActivityHandler = async (req, res) => {
  const data = await platformAuditDAO.list({ limit: parseIntQuery(req.query.limit, 20) });
  const formatted = data.map(formatAuditEntry);
  res.status(200).json({ success: true, collection: formatted });
};

const exportAuditLogHandler = async (req, res) => {
  const data = await platformAuditDAO.list(buildAuditFilters(req.query, { limit: 1000 }));

  if (req.query.format === "csv") {
    const header = "ID,Action,Entity Type,Entity ID,Tenant ID,Actor User ID,IP Address,Created At,Title,Detail\n";
    const rows = data
      .map((entry) => {
        const meta = entry.metadata || {};
        const title = escapeCsv(meta.title || entry.action);
        const detail = escapeCsv(meta.detail || "");
        return [
          entry.id,
          escapeCsv(entry.action),
          escapeCsv(entry.entityType || ""),
          escapeCsv(entry.entityId || ""),
          escapeCsv(entry.tenantId || ""),
          escapeCsv(entry.actorUserId || ""),
          escapeCsv(entry.ipAddress || ""),
          escapeCsv(new Date(entry.createdAt).toISOString()),
          title,
          detail,
        ].join(",");
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
