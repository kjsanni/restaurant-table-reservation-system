const { verifyToken } = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");

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

    if (process.env.TENANT_MODE === "enabled" && user.tenantId) {
      try {
        const Tenant = require("../../tenant-platform/models/tenant")(require("../db/models").sequelize, require("sequelize").DataTypes);
        const tenant = await Tenant.findByPk(user.tenantId);
        if (tenant) req.tenant = tenant;
      } catch (err) {
        console.warn("Tenant load failed:", err.message);
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

module.exports = { protect, admin, staff, staffOnly, requirePermission };