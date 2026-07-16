const db = require("../db/models");
const AuditLog = db.auditLog;
const User = db.user;
const { Op } = db.Sequelize;

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

const buildWhere = (filters = {}) => {
  const where = {};
  if (filters.from) where.createdAt = { ...where.createdAt, [Op.gte]: filters.from };
  if (filters.to) where.createdAt = { ...where.createdAt, [Op.lte]: filters.to };
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.userId) where.userId = filters.userId;
  if (filters.search) {
    where[Op.or] = [
      { changes: { [Op.like]: `%${filters.search}%` } },
      { ipAddress: { [Op.like]: `%${filters.search}%` } },
    ];
  }
  return where;
};

const getAllLogs = async (filters = {}, { page = 1, pageSize = 25, sortBy = "createdAt", sortOrder = "DESC" } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (safePage - 1) * safeSize;

  const allowedSortColumns = ["createdAt", "action", "entityType", "userId", "ipAddress"];
  const orderColumn = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";
  const orderDirection = sortOrder === "ASC" ? "ASC" : "DESC";

  const where = buildWhere(filters);

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [[orderColumn, orderDirection]],
    limit: safeSize,
    offset,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "role"],
        required: false,
      },
    ],
  });

  const logs = rows.map((log) => {
    const plain = log.toJSON();
    const user = plain.user || {};
    return {
      id: plain.id,
      createdAt: plain.createdAt,
      action: formatAction(plain.action),
      entityType: formatEntityType(plain.entityType),
      entityId: plain.entityId,
      userId: user.username || plain.userId || "System",
      userRole: user.role || "",
      changes: formatChanges(plain.changes),
      ipAddress: plain.ipAddress,
    };
  });

  return {
    logs,
    total: count,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.ceil(count / safeSize),
  };
};

const getLogStats = async (filters = {}) => {
  const where = buildWhere(filters);

  const [actionStats, entityStats, userStats] = await Promise.all([
    AuditLog.findAll({
      attributes: [
        "action",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "count"],
      ],
      where,
      group: ["action"],
      raw: true,
    }),
    AuditLog.findAll({
      attributes: [
        "entityType",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "count"],
      ],
      where,
      group: ["entityType"],
      raw: true,
    }),
    AuditLog.findAll({
      attributes: [
        "userId",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "count"],
      ],
      where,
      group: ["userId"],
      order: [[AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("id")), "DESC"]],
      limit: 10,
      raw: true,
    }),
  ]);

  return {
    byAction: actionStats.map((row) => ({ action: row.action, count: parseInt(row.count, 10) })),
    byEntity: entityStats.map((row) => ({ entityType: row.entityType, count: parseInt(row.count, 10) })),
    topUsers: userStats.map((row) => ({ userId: row.userId || "System", count: parseInt(row.count, 10) })),
    total: actionStats.reduce((sum, row) => sum + parseInt(row.count, 10), 0),
  };
};

const bulkDeleteLogs = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const safeIds = ids.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id) && id > 0);
  if (!safeIds.length) return 0;
  const deleted = await AuditLog.destroy({ where: { id: safeIds } });
  return typeof deleted === "number" ? deleted : 0;
};

const exportLogsCSV = async (filters = {}) => {
  const { logs } = await getAllLogs(filters, { page: 1, pageSize: 1000 });
  const header = ["ID", "Created At", "User", "Action", "Entity", "Entity ID", "Changes", "IP Address"];
  const csvCell = (value) => {
    const str = value === null || value === undefined ? "" : String(value);
    const needsQuote = /[",\n]/.test(str) || /^=[+\-@]/.test(str);
    const safe = str.replace(/"/g, '""');
    return needsQuote ? `"${safe}"` : safe;
  };
  let csv = header.map(csvCell).join(",") + "\n";
  logs.forEach((log) => {
    csv += [log.id, log.createdAt, log.userId, log.action, log.entityType, log.entityId || "", log.changes || "", log.ipAddress || ""]
      .map(csvCell)
      .join(",") + "\n";
  });
  return csv;
};

const exportLogsJSON = async (filters = {}) => {
  const { logs } = await getAllLogs(filters, { page: 1, pageSize: 1000 });
  return JSON.stringify(logs, null, 2);
};

const formatAction = (action) => {
  if (!action) return "Unknown";
  const map = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    cancel: "Cancelled",
    login: "Logged In",
    logout: "Logged Out",
    auth_failed: "Auth Failed",
    read: "Viewed",
  };
  return map[action.toLowerCase()] || action;
};

const formatEntityType = (type) => {
  if (!type) return "Unknown";
  const map = {
    reservation: "Reservation",
    customer: "Customer",
    table: "Table",
    user: "User",
    role: "Role",
    group: "Group",
    payment: "Payment",
    schedule: "Schedule",
    setting: "Setting",
    waitlist: "Waitlist Entry",
    report: "Report",
    audit_log: "Audit Log",
    rbac: "RBAC",
    auth: "Authentication",
  };
  return map[type.toLowerCase()] || type;
};

const FIELD_LABELS = {
  resDate: "date",
  resTime: "time",
  resStatus: "status",
  paymentStatus: "payment status",
  expectedTotal: "expected total",
  people: "party size",
  notes: "notes",
  customerName: "customer name",
  customerEmail: "customer email",
  customerPhone: "customer phone",
  firstName: "first name",
  lastName: "last name",
  email: "email",
  phone: "phone",
  name: "name",
  role: "role",
  permissions: "permissions",
  groupId: "group",
  tableId: "table",
  reservationId: "reservation",
  amount: "amount",
  method: "payment method",
  discount: "discount",
  paidBy: "paid by",
  reference: "reference",
  isClosed: "closed status",
  description: "description",
  dayOfWeek: "day",
  openingTime: "opening time",
  closingTime: "closing time",
  value: "value",
  key: "setting",
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "none";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatFieldChanges = (body) => {
  const entries = Object.entries(body).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return null;

  const parts = entries.map(([key, value]) => {
    const label = FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
    return `${label} to ${formatValue(value)}`;
  });

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  const last = parts.pop();
  return `${parts.join(", ")}, and ${last}`;
};

const formatChanges = (changes) => {
  if (!changes) return null;
  if (typeof changes === "string") {
    try {
      changes = JSON.parse(changes);
    } catch {
      return changes;
    }
  }

  const parts = [];

  if (changes.body && typeof changes.body === "object") {
    const bodyParts = [];
    for (const [key, value] of Object.entries(changes.body)) {
      if (value !== null && value !== undefined && value !== "") {
        const label = FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
        bodyParts.push(`${label} to ${formatValue(value)}`);
      }
    }
    if (bodyParts.length) {
      parts.push(bodyParts.join(", "));
    }
  }

  if (changes.params && typeof changes.params === "object") {
    const paramParts = [];
    for (const [key, value] of Object.entries(changes.params)) {
      if (value !== null && value !== undefined && value !== "") {
        paramParts.push(`${key}: ${value}`);
      }
    }
    if (paramParts.length) {
      parts.push(`parameters: ${paramParts.join(", ")}`);
    }
  }

  if (!parts.length) return "No details available";
  return parts.join("; ");
};

module.exports = {
  createLog,
  getAllLogs,
  getLogStats,
  bulkDeleteLogs,
  exportLogsCSV,
  exportLogsJSON,
  buildWhere,
};
