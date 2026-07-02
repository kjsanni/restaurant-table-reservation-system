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

const getAllLogs = async () => {
  const logs = await AuditLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 100,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "role"],
        required: false,
      },
    ],
  });

  return logs.map((log) => {
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
  };
  return map[type.toLowerCase()] || type;
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
        bodyParts.push(`${key}: ${value}`);
      }
    }
    if (bodyParts.length) {
      parts.push(`Updated ${bodyParts.join(", ")}`);
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
      parts.push(`Parameters: ${paramParts.join(", ")}`);
    }
  }

  return parts.join("; ") || "No details available";
};

module.exports = {
  createLog,
  getAllLogs,
};