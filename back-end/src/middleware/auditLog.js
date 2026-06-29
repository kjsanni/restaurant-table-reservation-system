const db = require("../db/models");
const AuditLog = db.auditLog;

const SENSITIVE_FIELDS = ["password", "token", "secret", "jwt"];

const sanitizeData = (data) => {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
};

const truncate = (str, maxLength = 500) => {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

const logAction = async (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  const log = async (data) => {
    const route = req.route ? req.route.path : req.path;
    let action = "unknown";
    if (req.method === "POST") action = "create";
    else if (req.method === "PATCH") action = "update";
    else if (req.method === "DELETE") action = "delete";
    else if (req.method === "GET") action = "read";

    let entityType = "unknown";
    if (route.includes("reservations")) entityType = "reservation";
    else if (route.includes("tables")) entityType = "table";
    else if (route.includes("schedule")) entityType = "schedule";
    else if (route.includes("staff")) entityType = "user";

    try {
      await AuditLog.create({
        action,
        entityType,
        userId: req.user?.id,
        changes: {
          body: sanitizeData(req.body),
          params: sanitizeData(req.params),
        },
        ipAddress: req.ip,
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }

    if (typeof res.send === "function") res.send = originalSend;
    if (typeof res.json === "function") res.json = originalJson;
  };

  const logAuthFailure = async (statusCode) => {
    const route = req.route ? req.route.path : req.path;
    try {
      await AuditLog.create({
        action: "auth_failed",
        entityType: "auth",
        userId: null,
        changes: {
          route,
          method: req.method,
          statusCode,
          ipAddress: req.ip,
          userAgent: truncate(req.get("user-agent")),
        },
        ipAddress: req.ip,
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  res.send = function(data) {
    const status = this.statusCode;
    if (status === 401 || status === 403) {
      logAuthFailure(status);
    } else {
      log(data);
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    const status = this.statusCode;
    if (status === 401 || status === 403) {
      logAuthFailure(status);
    } else {
      log(data);
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = { logAction };
