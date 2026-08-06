const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const ANOMALY_RULES = {
  NEW_IP_LOGIN: "new_ip_login",
  AFTER_HOURS_ACCESS: "after_hours_access",
  BULK_EXPORT: "bulk_export",
  COMPLIANCE_CHANGE: "compliance_change",
  AUTH_BURST: "auth_burst",
};

const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const checkNewIpLogin = async (userId, userIp) => {
  if (!userIp) return null;

  const recentIps = await platformAuditDAO.findAllForUser(userId, {
    action: { [require("sequelize").Op.in]: ["super_admin.access_granted", "platform_role.access_granted"] },
    limit: 10,
  });

  const knownIps = [...new Set(recentIps.map((entry) => entry.metadata?.ipAddress).filter(Boolean))];
  if (knownIps.length > 0 && !knownIps.includes(userIp)) {
    return {
      rule: ANOMALY_RULES.NEW_IP_LOGIN,
      severity: SEVERITY.MEDIUM,
      description: `New IP address detected for user: ${userIp}`,
      metadata: { ip: userIp, knownIps },
    };
  }
  return null;
};

const checkAfterHoursAccess = (hour) => {
  if (hour < 6 || hour > 22) {
    return {
      rule: ANOMALY_RULES.AFTER_HOURS_ACCESS,
      severity: SEVERITY.LOW,
      description: `Access during off-hours: ${hour}:00 UTC`,
      metadata: { hour },
    };
  }
  return null;
};

const checkBulkExport = async (userId, now) => {
  const suspiciousActions = [
    "tenant.create",
    "tenant.update",
    "tenant.delete",
    "billing.update",
    "compliance.update",
    "platform_role.assign",
    "platform_role.revoke",
  ];

  const recentActions = await platformAuditDAO.findAllForUser(userId, {
    action: { [require("sequelize").Op.in]: suspiciousActions },
    limit: 20,
  });

  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const recentCount = recentActions.filter((a) => new Date(a.createdAt) > oneMinuteAgo).length;
  if (recentCount >= 5) {
    return {
      rule: ANOMALY_RULES.BULK_EXPORT,
      severity: SEVERITY.HIGH,
      description: `High-frequency platform actions: ${recentCount} in 1 minute`,
      metadata: { count: recentCount, window: "1m" },
    };
  }
  return null;
};

const checkAuthBurst = async (userId, now) => {
  const deniedActions = await platformAuditDAO.findAllForUser(userId, {
    action: { [require("sequelize").Op.in]: ["super_admin.access_denied", "platform_role.access_denied"] },
    limit: 10,
  });

  const suspiciousActions = [
    "tenant.create",
    "tenant.update",
    "tenant.delete",
    "billing.update",
    "compliance.update",
    "platform_role.assign",
    "platform_role.revoke",
  ];

  const recentActions = await platformAuditDAO.findAllForUser(userId, {
    action: { [require("sequelize").Op.in]: suspiciousActions },
    limit: 20,
  });

  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const deniedLast10m = deniedActions.filter((a) => new Date(a.createdAt) > tenMinutesAgo).length;
  const grantedLast10m = recentActions.filter((a) => new Date(a.createdAt) > tenMinutesAgo).length;

  if (deniedLast10m >= 3 && grantedLast10m > 0) {
    return {
      rule: ANOMALY_RULES.AUTH_BURST,
      severity: SEVERITY.HIGH,
      description: `Auth burst pattern: ${deniedLast10m} denials then ${grantedLast10m} grants in 10m`,
      metadata: { denied: deniedLast10m, granted: grantedLast10m, window: "10m" },
    };
  }
  return null;
};

const anomalyDetectionService = {
  async evaluate(req, res, next) {
    const anomalies = [];

    try {
      const userId = req.user?.id;
      if (!userId) return next();

      const userIp = req.ip || req.connection?.remoteAddress || null;
      const userAgent = req.get("user-agent") || null;
      const now = new Date();
      const hour = now.getUTCHours();

      const newIpAnomaly = await checkNewIpLogin(userId, userIp);
      if (newIpAnomaly) anomalies.push(newIpAnomaly);

      const afterHoursAnomaly = checkAfterHoursAccess(hour);
      if (afterHoursAnomaly) anomalies.push(afterHoursAnomaly);

      const bulkExportAnomaly = await checkBulkExport(userId, now);
      if (bulkExportAnomaly) anomalies.push(bulkExportAnomaly);

      const authBurstAnomaly = await checkAuthBurst(userId, now);
      if (authBurstAnomaly) anomalies.push(authBurstAnomaly);

      if (anomalies.length > 0) {
        req.anomalies = anomalies;
      }
    } catch (err) {
      console.error("Anomaly detection error:", err.message);
    }

    next();
  },

  getRules() {
    return { ...ANOMALY_RULES };
  },

  getSeverityLevels() {
    return { ...SEVERITY };
  },
};

module.exports = anomalyDetectionService;
