const { verifyToken } = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const { isNoTenantRequired } = require("./noTenantPaths");
const platformAuditDAO = require("../tenant-platform/DAOs/platformAudit.dao");

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token!",
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await authDAO.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists!",
      });
    }

    const permissions = user.permissions || {};
    if (!permissions || Object.keys(permissions).length === 0) {
      try {
        const roleDAO = require("../DAOs/role.dao");
        const effective = await roleDAO.getRolePermissions(user.id);
        user.permissions = effective && Object.keys(effective).length > 0 ? effective : {};
      } catch (err) {
        console.warn("RBAC lookup failed, denying implicit permissions:", err.message);
        user.permissions = {};
      }
    }

    req.user = user;

    // Tenant isolation: override whatever resolveTenant set from client
    // headers with the tenant from the authenticated user's JWT. This makes
    // x-tenant-id spoofing harmless — the DB lookup still happens in
    // resolveTenant, but the result is never exposed to controllers.
    if (process.env.TENANT_MODE === "enabled" && user.tenantId) {
      try {
        const db = require("../db/models");
        const tenant = await db.tenant.findByPk(user.tenantId);
        if (tenant) {
          req.tenant = tenant;
        } else {
          return res.status(403).json({
            success: false,
            message: "Your account is not assigned to a tenant.",
          });
        }
      } catch (err) {
        console.warn("Tenant load failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to resolve tenant.",
        });
      }
    } else if (process.env.TENANT_MODE === "enabled" && !user.tenantId) {
      // Super-admin / platform user: allow tenant-scoped routes without a
      // tenant, but only if resolveTenant was explicitly bypassed (platform
      // admin paths). If resolveTenant set one from a spoofed header, clear it.
      if (req.tenant && !isNoTenantRequired(req.path)) {
        req.tenant = null;
      }
    }

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed!",
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Admin access required!",
    });
  }
};

const requireSuperAdmin = (req, res, next) => {
  // Decision: platform_admin platform role is granted full super-admin access here.
  // This is intentional for now because the existing platform portals do not yet
  // distinguish between platform-admin-only routes and true super-admin routes.
  // Revisit this block when finer-grained platform roles are required, and split
  // requireSuperAdmin into dedicated middleware for any narrower scope.
  const hasSuperAdmin = req.user && (
    req.user.isSuperAdmin ||
    (Array.isArray(req.user.platformRoles) && req.user.platformRoles.includes("platform_admin"))
  );

  if (hasSuperAdmin) {
    next();
  } else {
    const actorUserId = req.user?.id || null;
    const tenantId = req.tenant?.id || null;
    platformAuditDAO
      .log(
        actorUserId,
        "super_admin.access_denied",
        "admin",
        null,
        tenantId,
        { path: req.path, method: req.method, ipAddress: req.ip },
        req.ip
      )
      .catch(() => {});
    return res.status(403).json({
      success: false,
      message: "Super admin access required!",
    });
  }
};

const requirePlatformRole = (role) => {
  return (req, res, next) => {
    const userRoles = Array.isArray(req.user?.platformRoles) ? req.user.platformRoles : [];
    const hasRole = req.user?.isSuperAdmin || userRoles.includes(role) || userRoles.includes("platform_admin");

    if (hasRole) {
      next();
    } else {
      const actorUserId = req.user?.id || null;
      const tenantId = req.tenant?.id || null;
      platformAuditDAO
        .log(
          actorUserId,
          "platform_role.access_denied",
          "admin",
          null,
          tenantId,
          { path: req.path, method: req.method, requiredRole: role, ipAddress: req.ip },
          req.ip
        )
        .catch(() => {});
      return res.status(403).json({
        success: false,
        message: `Platform role '${role}' required!`,
      });
    }
  };
};

const staff = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Staff access required!",
    });
  }
};

const staffOnly = (req, res, next) => {
  if (req.user && req.user.role === "staff") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Staff-only access required!",
    });
  }
};

const customer = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Customer access required!",
    });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized!",
      });
    }
    const userPermissions = req.user.permissions || {};
    if (userPermissions[permission] === true) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required!`,
      });
    }
  };
};

module.exports = { protect, admin, staff, staffOnly, customer, requirePermission, requireSuperAdmin, requirePlatformRole };