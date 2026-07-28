const authService = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const roleDAO = require("../DAOs/role.dao");
const { applyTypeDefaults, TYPE_DEFAULTS } = require("../tenant-platform/services/tenantTypeDefaults.service");

const registerStatusHandler = async (req, res) => {
  const { registrationEnabled } = await authService.checkRegistrationStatus(
    authDAO,
    req.tenant?.id
  );

  return res.status(200).json({
    success: true,
    registrationEnabled,
  });
};

const registerHandler = async (req, res) => {
  const payload = req.body;
  const { registrationEnabled } = await authService.checkRegistrationStatus(
    authDAO,
    req.tenant?.id
  );

  if (!registrationEnabled) {
    throw {
      status: 403,
      message: "Registration is currently disabled!",
    };
  }

  await authService.registerUser(authDAO, payload, req.tenant?.id);

  return res.status(201).json({
    success: true,
    message: "Successfully registered user!",
  });
};

const loginHandler = async (req, res) => {
  const payload = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  const result = await authService.loginUser(authDAO, payload, req.tenant?.id, authDAO, ipAddress);

  if (result.pendingTOTP) {
    return res.status(200).json({
      success: true,
      pendingTOTP: true,
      message: "TOTP verification required",
      user: result.user,
    });
  }

  const isSecure = req.secure || false;
  const cookieBase = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "lax" : false,
    path: "/",
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

const loginTOTPHandler = async (req, res) => {
  const { tempToken, token } = req.body;
  if (!tempToken || !token) {
    return res.status(400).json({ success: false, message: "Temporary token and TOTP code are required" });
  }

  try {
    const decoded = authService.verifyToken(tempToken);
    const user = await authDAO.findUserById(decoded.userId, req.tenant?.id);
    if (!user || !user.totpSecret || !user.totpEnabled) {
      return res.status(400).json({ success: false, message: "Invalid TOTP session" });
    }

    const totpService = require("../../services/totp.service");
    const isValid = totpService.verifyTOTP(user.totpSecret, String(token).trim());
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid TOTP token" });
    }

    const newToken = authService.generateToken(user.id, user.role);
    const newRefreshToken = authService.generateRefreshToken();

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authDAO.createRefreshToken(user.id, newRefreshToken, expiresAt, req.tenant?.id);

    const isSecure = req.secure || false;
    const cookieBase = {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "lax" : false,
      path: "/",
    };

    res.cookie("token", newToken, {
      ...cookieBase,
      maxAge: 30 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || {},
        isSuperAdmin: !!user.isSuperAdmin,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid or expired temporary token" });
  }
};

const getMeHandler = async (req, res) => {
  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
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
        manage_settings: true,
        view_appointments: true,
        edit_appointments: true,
        manage_stations: true,
        manage_services: true,
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
        view_appointments: true,
        edit_appointments: true,
        manage_stations: true,
        manage_services: true,
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
        view_appointments: true,
        edit_appointments: true,
        manage_stations: false,
        manage_services: false,
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

const getTenantCapabilitiesHandler = async (req, res) => {
  if (!req.tenant) {
    return res.status(200).json({
      success: true,
      capabilities: null,
    });
  }

  const featureFlags = req.tenant.settings?.featureFlags || {};

  return res.status(200).json({
    success: true,
    capabilities: {
      businessVertical: req.tenant.businessVertical || "restaurant",
      restaurantType: req.tenant.restaurantType || "full_service",
      serviceModes: Array.isArray(req.tenant.serviceModes) ? req.tenant.serviceModes : ["dine_in", "takeaway", "delivery"],
      featureFlags,
    },
  });
};

const setupTenantHandler = async (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ success: false, message: "Tenant context required" });
  }

  const { businessVertical, restaurantType, serviceModes } = req.body;
  const tenant = req.tenant;

  const VALID_MODES = ["dine_in", "takeaway", "delivery"];
  const VALID_TYPES = Object.keys(TYPE_DEFAULTS);

  if (businessVertical) {
    tenant.businessVertical = businessVertical;
  }

  if (businessVertical === "salon") {
    if (!tenant.restaurantType || tenant.restaurantType !== "salon") {
      applyTypeDefaults(tenant, "salon");
    }
    const { seedSalonSettings } = require("../tenant-platform/services/tenantTypeDefaults.service");
    seedSalonSettings(tenant.id).catch((err) => {
      console.error("Failed to seed salon settings:", err.message);
    });
  } else if (restaurantType !== undefined) {
    if (!VALID_TYPES.includes(restaurantType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid restaurantType. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }
    if (restaurantType !== tenant.restaurantType) {
      applyTypeDefaults(tenant, restaurantType);
    }
  }

  if (businessVertical !== "salon" && serviceModes !== undefined) {
    if (!Array.isArray(serviceModes) || serviceModes.length === 0) {
      return res.status(400).json({ success: false, message: "serviceModes must be a non-empty array" });
    }
    const allValid = serviceModes.every((m) => VALID_MODES.includes(m));
    if (!allValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid serviceModes. Must be from: ${VALID_MODES.join(", ")}`,
      });
    }
    tenant.serviceModes = serviceModes;
  }

  await tenant.save();

  return res.status(200).json({
    success: true,
    item: {
      businessVertical: tenant.businessVertical,
      restaurantType: tenant.restaurantType,
      serviceModes: tenant.serviceModes,
    },
  });
};

const logoutHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && authDAO.revokeRefreshToken) {
      await authDAO.revokeRefreshToken(refreshToken, req.tenant?.id);
    }
  } catch {
    // ignore token revocation errors during logout
  }

  const isSecure = req.secure || false;
  const cookieOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "lax" : false, // dev-only HTTP: false; production HTTP: "lax" via isSecure check
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
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token missing." });
  }
  const result = await authService.refreshAccessToken(authDAO, refreshToken, req.tenant?.id);

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
  await authService.revokeRefreshToken(authDAO, refreshToken, req.tenant?.id);

  return res.status(200).json({
    success: true,
    message: "Token revoked successfully!",
  });
};

const getLocaleHandler = async (req, res) => {
  const locale = req.user?.locale || "en";
  return res.status(200).json({ success: true, locale });
};

const updateLocaleHandler = async (req, res) => {
  const { locale } = req.body;
  if (!locale || typeof locale !== "string") {
    return res.status(400).json({ success: false, message: "Invalid locale" });
  }
  const user = await authDAO.findUserById(req.user.id, req.tenant?.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  await authDAO.updateUser(req.user.id, { locale });
  return res.status(200).json({ success: true, locale });
};

const getSettingsHandler = async (req, res) => {
  const settings = await authDAO.getAllSettings(req.tenant?.id);
  return res.status(200).json({
    success: true,
    settings,
  });
};

const updateSettingsHandler = async (req, res) => {
  const { key, value } = req.body;
  const allowedKeys = [
    "business_hours",
    "customer_registration_enabled",
    "reservation_slot_duration",
    "max_party_size",
    "allow_past_reservations",
    "require_table_assignment",
    "table_base_price",
    "table_price_per_additional_seat",
    "whatsapp_config",
    "notification_channels",
    "paystack_config",
    "tenant_mode_enabled",
    "feature_flags",
    "maintenance_mode",
    "currency_locale",
    "reservation_window",
    "branding",
    "message_templates",
    "email_server",
    "salon_whatsapp_config",
    "salon_payment_config",
    "salon_message_templates",
    "salon_sms_fallback_enabled",
    "salon_feature_flags",
    "password_policy",
  ];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ success: false, message: "Unknown or protected setting key." });
  }
  const setting = await authDAO.updateSetting(key, value, req.tenant?.id);
  if (key === "tenant_mode_enabled") {
    try {
      const { resetTenantModeCache } = require("../tenant-platform/utils/tenantMode");
      resetTenantModeCache();
    } catch {
      // module not loaded when TENANT_MODE off; ignore
    }
  }
  return res.status(200).json({
    success: true,
    message: "Setting updated successfully!",
    setting,
  });
};

const getAllStaffHandler = async (req, res) => {
  const users = await authDAO.getAllStaff(req.tenant?.id);
  return res.status(200).json({
    success: true,
    users,
  });
};

const getAllUsersHandler = async (req, res) => {
  const users = await authDAO.getAllUsers(req.tenant?.id);
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
  }, req.tenant?.id);

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

  if (req.user.id === parseInt(id) && updates.role && updates.role !== "admin") {
    throw {
      status: 400,
      message: "Cannot change your own admin role!",
    };
  }

  const user = await authDAO.updateStaffUser(id, updates, req.tenant?.id);

  return res.status(200).json({
    success: true,
    message: "Staff member updated successfully!",
    user,
  });
};

const deleteStaffHandler = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === parseInt(id)) {
    throw {
      status: 400,
      message: "Cannot delete your own account!",
    };
  }

  const currentUser = await authDAO.findUserById(req.user.id, req.tenant?.id);
  const targetUser = await authDAO.findUserById(id, req.tenant?.id);

  if (targetUser?.role === "admin" && currentUser.role === "admin") {
    const adminCount = await authDAO.getAdminCount(req.tenant?.id);
    if (adminCount <= 1) {
      throw {
        status: 400,
        message: "Cannot delete the last admin!",
      };
    }
  }

  await authDAO.deleteStaffUser(id, req.tenant?.id);

  return res.status(200).json({
    success: true,
    message: "Staff member deleted successfully!",
  });
};

module.exports = {
  registerStatusHandler,
  registerHandler,
  loginHandler,
  loginTOTPHandler,
  getMeHandler,
  getTenantCapabilitiesHandler,
  setupTenantHandler,
  logoutHandler,
  refreshTokenHandler,
  revokeTokenHandler,
  getSettingsHandler,
  updateSettingsHandler,
  getLocaleHandler,
  updateLocaleHandler,
  getAllStaffHandler,
  getAllUsersHandler,
  updateStaffHandler,
  deleteStaffHandler,
};
