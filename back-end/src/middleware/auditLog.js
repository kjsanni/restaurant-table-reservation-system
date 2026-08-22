const db = require("../db/models");
const AuditLog = db.auditLog;

const SENSITIVE_FIELDS = ["password", "token", "secret", "jwt", "email", "phone", "address", "firstName", "lastName", "name", "ccNumber", "cvv", "expiry", "bankAccount", "nin", "ssn"];
const PROTECTED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const WHITELISTED_AUTH_FIELDS = ["route", "method", "statusCode", "ipAddress", "userAgent"];

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || req.ip || req.connection?.remoteAddress || null;
  }
  return req.ip || req.connection?.remoteAddress || null;
};

const sanitizeData = (data) => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const entries = Object.entries(data)
    .filter(([key]) => !SENSITIVE_FIELDS.includes(key) && !PROTECTED_KEYS.has(key))
    .map(([key, value]) => [key, value && typeof value === "object" ? sanitizeData(value) : value]);

  return Object.fromEntries(entries);
};

const truncate = (str, maxLength = 500) => {
  if (!str) return null;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

const logAction = async (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  const log = async (_unused) => {
    const route = req.route ? req.route.path : req.path;
    let action = "unknown";
    if (req.method === "POST") action = "create";
    else if (req.method === "PATCH") action = "update";
    else if (req.method === "DELETE") action = "delete";
    else if (req.method === "GET") action = "read";

    let entityType = "unknown";
    if (route.includes("reservations")) entityType = "reservation";
    else if (route.includes("waitlist")) entityType = "waitlist";
    else if (route.includes("tables")) entityType = "table";
    else if (route.includes("schedule")) entityType = "schedule";
    else if (route.includes("payments")) entityType = "payment";
    else if (route.includes("reports")) entityType = "report";
    else if (route.includes("audit-logs")) entityType = "audit_log";
    else if (route.includes("rbac/roles")) entityType = "role";
    else if (route.includes("rbac/groups")) entityType = "group";
    else if (route.includes("rbac")) entityType = "rbac";
    else if (route.includes("tenants")) entityType = "tenant";
    else if (route.includes("notifications")) entityType = "notification";
    else if (route.includes("billing")) entityType = "billing";
    else if (route.includes("customers")) entityType = "customer";
    else if (route.includes("profile")) entityType = "profile";
    else if (route.includes("settings")) entityType = "setting";
    else if (route.includes("staff")) entityType = "staff";
    else if (
      route.includes("auth") ||
      route.includes("login") ||
      route.includes("logout") ||
      route.includes("register")
    )
      entityType = "auth";
    else if (route.includes("feature-flags")) entityType = "feature_flag";

    try {
      await AuditLog.create({
        action,
        entityType,
        userId: req.user?.id,
        changes: {
          body: sanitizeData(req.body),
          params: sanitizeData(req.params),
        },
        ipAddress: getClientIp(req),
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
      const changes = {};
      for (const field of WHITELISTED_AUTH_FIELDS) {
        if (field === "route") changes[field] = route;
        else if (field === "method") changes[field] = req.method;
        else if (field === "statusCode") changes[field] = statusCode;
        else if (field === "ipAddress") changes[field] = getClientIp(req);
        else if (field === "userAgent") changes[field] = truncate(req.get("user-agent"));
      }
      await AuditLog.create({
        action: "auth_failed",
        entityType: "auth",
        userId: null,
        changes,
        ipAddress: getClientIp(req),
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
