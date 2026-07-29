const db = require("../db/models");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const PLATFORM_ROLES = {
  platform_admin: {
    key: "platform_admin",
    label: "Platform Admin",
    description: "Full platform access including tenant management, billing, and compliance",
    permissions: ["*"],
  },
  platform_billing: {
    key: "platform_billing",
    label: "Billing Admin",
    description: "Manage invoices, revenue, refunds, and payment operations",
    permissions: ["billing.read", "billing.write", "revenue.read", "invoices.read", "invoices.write"],
  },
  platform_support: {
    key: "platform_support",
    label: "Support Admin",
    description: "Manage support tickets, live chat, and customer escalations",
    permissions: ["support.read", "support.write", "tickets.read", "tickets.write", "chat.read", "chat.write"],
  },
  platform_technical: {
    key: "platform_technical",
    label: "Technical Admin",
    description: "Manage deployments, integrations, API keys, and system health",
    permissions: ["technical.read", "technical.write", "deployments.read", "integrations.read", "integrations.write"],
  },
  platform_compliance: {
    key: "platform_compliance",
    label: "Compliance Admin",
    description: "Manage legal documents, DSAR requests, data retention, and audit logs",
    permissions: ["compliance.read", "compliance.write", "dsar.read", "dsar.write", "audit.read", "legal.read", "legal.write"],
  },
};

const listPlatformRolesHandler = async (req, res) => {
  const roles = Object.values(PLATFORM_ROLES).map((role) => ({
    key: role.key,
    label: role.label,
    description: role.description,
    permissions: role.permissions,
  }));
  return res.status(200).json({ success: true, roles });
};

const assignPlatformRoleHandler = async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ success: false, message: "userId and role are required" });
  }

  if (!PLATFORM_ROLES[role]) {
    return res.status(400).json({ success: false, message: "Invalid platform role" });
  }

  const user = await db.user.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentRoles = Array.isArray(user.platformRoles) ? user.platformRoles : [];
  if (!currentRoles.includes(role)) {
    currentRoles.push(role);
    user.platformRoles = currentRoles;
    await user.save();

    await platformAuditDAO
      .log(
        req.user?.id || null,
        "platform_role_assigned",
        "user",
        userId,
        req.tenant?.id,
        { role, assignedBy: req.user?.id },
        req.ip
      )
      .catch((err) => {
        console.error("platform_role_assigned audit log failed:", err.message);
      });
  }

  return res.status(200).json({ success: true, platformRoles: user.platformRoles });
};

const revokePlatformRoleHandler = async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ success: false, message: "userId and role are required" });
  }

  if (!PLATFORM_ROLES[role]) {
    return res.status(400).json({ success: false, message: "Invalid platform role" });
  }

  const user = await db.user.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const currentRoles = Array.isArray(user.platformRoles) ? user.platformRoles : [];
  const idx = currentRoles.indexOf(role);
  if (idx >= 0) {
    currentRoles.splice(idx, 1);
    user.platformRoles = currentRoles;
    await user.save();

    await platformAuditDAO
      .log(
        req.user?.id || null,
        "platform_role_revoked",
        "user",
        userId,
        req.tenant?.id,
        { role, revokedBy: req.user?.id },
        req.ip
      )
      .catch((err) => {
        console.error("platform_role_revoked audit log failed:", err.message);
      });
  }

  return res.status(200).json({ success: true, platformRoles: user.platformRoles });
};

module.exports = {
  listPlatformRolesHandler,
  assignPlatformRoleHandler,
  revokePlatformRoleHandler,
};
