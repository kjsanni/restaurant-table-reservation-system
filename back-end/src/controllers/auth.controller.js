const authService = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const roleDAO = require("../DAOs/role.dao");

const registerStatusHandler = async (req, res) => {
  const { registrationEnabled } = await authService.checkRegistrationStatus(
    authDAO
  );

  return res.status(200).json({
    success: true,
    registrationEnabled,
  });
};

const registerHandler = async (req, res) => {
  const payload = req.body;
  const { registrationEnabled } = await authService.checkRegistrationStatus(
    authDAO
  );

  if (!registrationEnabled) {
    throw {
      status: 403,
      message: "Registration is currently disabled!",
    };
  }

  await authService.registerUser(authDAO, payload);

  return res.status(201).json({
    success: true,
    message: "Successfully registered user!",
  });
};

const loginHandler = async (req, res) => {
  const payload = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const result = await authService.loginUser(authDAO, payload, authDAO, ipAddress);

  const isSecure = req.secure || false;
  const cookieBase = {
    httpOnly: true,
    secure: isSecure,
    path: "/",
    sameSite: isSecure ? "lax" : false,
  };

  res.cookie("token", result.token, {
    ...cookieBase,
    maxAge: 30 * 60 * 1000,
  });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful!",
    user: result.user,
  });
};

const getMeHandler = async (req, res) => {
  const user = await authDAO.findUserById(req.user.id);
  let effectivePermissions = user.permissions || {};
  try {
    const rbacPermissions = await roleDAO.getRolePermissions(req.user.id);
    if (rbacPermissions && Object.keys(rbacPermissions).length > 0) {
      effectivePermissions = rbacPermissions;
    }
  } catch (err) {
    console.warn("getMe RBAC lookup failed:", err.message);
  }

  if (!effectivePermissions || Object.keys(effectivePermissions).length === 0) {
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
    effectivePermissions = defaults[user.role] || defaults.staff;
  }

  return res.status(200).json({
    success: true,
    user: {
      ...user.toJSON(),
      permissions: effectivePermissions,
    },
  });
};

const logoutHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && authDAO.revokeRefreshToken) {
      await authDAO.revokeRefreshToken(refreshToken);
    }
  } catch {
    // ignore token revocation errors during logout
  }

  const isSecure = req.secure || false;
  const cookieOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "lax" : false,
    path: "/",
  };

  res.clearCookie("token", cookieOpts);
  res.clearCookie("refreshToken", cookieOpts);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully!",
  });
};

const refreshTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(authDAO, refreshToken);

  const isProd = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    path: "/",
    sameSite: isProd ? "lax" : false,
  };

  res.cookie("token", result.token, {
    ...cookieBase,
    maxAge: 30 * 60 * 1000,
  });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  return res.status(200).json({
    success: true,
    token: result.token,
    refreshToken: result.refreshToken,
    user: result.user,
  });
};

const revokeTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;
  await authService.revokeRefreshToken(authDAO, refreshToken);

  return res.status(200).json({
    success: true,
    message: "Token revoked successfully!",
  });
};

const getSettingsHandler = async (req, res) => {
  const settings = await authDAO.getAllSettings();
  return res.status(200).json({
    success: true,
    settings,
  });
};

const updateSettingsHandler = async (req, res) => {
  const { key, value } = req.body;
  const setting = await authDAO.updateSetting(key, value);

  return res.status(200).json({
    success: true,
    message: "Setting updated successfully!",
    setting,
  });
};

const getAllStaffHandler = async (req, res) => {
  const users = await authDAO.getAllStaff();
  return res.status(200).json({
    success: true,
    users,
  });
};

const getAllUsersHandler = async (req, res) => {
  const users = await authDAO.getAllUsers();
  return res.status(200).json({
    success: true,
    users,
  });
};

const VALID_USER_ROLES = ["admin", "manager", "staff"];

const createStaffHandler = async (req, res) => {
  const { username, email, password, role, permissions } = req.body;
  const normalizedRole = VALID_USER_ROLES.includes(role) ? role : "staff";
  const user = await authDAO.createStaffUser({
    username,
    email,
    password,
    role: normalizedRole,
    permissions,
  });

  return res.status(201).json({
    success: true,
    message: "Staff member added successfully!",
    user,
  });
};

const updateStaffHandler = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.role && !VALID_USER_ROLES.includes(updates.role)) {
    throw { status: 400, message: "Invalid role!" };
  }

  // Prevent admin from demoting themselves
  if (req.user.id === parseInt(id) && updates.role && updates.role !== "admin") {
    throw {
      status: 400,
      message: "Cannot change your own admin role!",
    };
  }

  const user = await authDAO.updateStaffUser(id, updates);

  return res.status(200).json({
    success: true,
    message: "Staff member updated successfully!",
    user,
  });
};

const deleteStaffHandler = async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user.id === parseInt(id)) {
    throw {
      status: 400,
      message: "Cannot delete your own account!",
    };
  }

  // Check if this is the last admin
  const currentUser = await authDAO.findUserById(req.user.id);
  const targetUser = await authDAO.findUserById(id);

  if (targetUser?.role === "admin" && currentUser.role === "admin") {
    const adminCount = await authDAO.getAdminCount();
    if (adminCount <= 1) {
      throw {
        status: 400,
        message: "Cannot delete the last admin!",
      };
    }
  }

  await authDAO.deleteStaffUser(id);

  return res.status(200).json({
    success: true,
    message: "Staff member deleted successfully!",
  });
};

module.exports = {
  registerStatusHandler,
  registerHandler,
  loginHandler,
  getMeHandler,
  logoutHandler,
  refreshTokenHandler,
  revokeTokenHandler,
  getSettingsHandler,
  updateSettingsHandler,
  getAllStaffHandler,
  getAllUsersHandler,
  createStaffHandler,
  updateStaffHandler,
  deleteStaffHandler,
};
