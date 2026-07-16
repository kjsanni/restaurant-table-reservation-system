const db = require("../db/models");
const AuditLog = db.auditLog;
const User = db.user;

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

const getAllLogs = async ({ page = 1, pageSize = 25 } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeSize = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (safePage - 1) * safeSize;

  const { count, rows } = await AuditLog.findAndCountAll({
    order: [["createdAt", "DESC"]],
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
};