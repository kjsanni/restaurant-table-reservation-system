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
      const defaults = {
        admin: {
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: true,
          manage_staff: true,
          manage_roles: true,
          manage_groups: true,
          view_audit_logs: true,
        },
        manager: {
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: true,
          manage_staff: false,
          manage_roles: false,
          manage_groups: false,
          view_audit_logs: true,
        },
        staff: {
          view_reservations: true,
          edit_reservations: true,
          manage_tables: true,
          manage_schedule: false,
          manage_staff: false,
          manage_roles: false,
          manage_groups: false,
          view_audit_logs: false,
        },
      };
      user.permissions = defaults[user.role] || defaults.staff;
    }

    req.user = user;
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