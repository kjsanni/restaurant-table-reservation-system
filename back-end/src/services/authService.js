const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verifyTokenWithFallback, getCurrentSecret } = require("../utils/jwtRotation");

const JWT_SECRET = getCurrentSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30m";

const generateToken = (userId, role, locale = "en") => {
  return jwt.sign({ userId, role, locale }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const verifyToken = (token) => {
  return verifyTokenWithFallback(token);
};

const verifyRefreshToken = (token) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is not configured");
  }
  return jwt.verify(token, refreshSecret);
};

const registerUser = async (userDAO, payload, tenantId, role = "staff", options = {}) => {
  const { username, email, password } = payload;

  if (!username || !email || !password) {
    throw {
      status: 400,
      message: "Please provide username, email, and password!",
    };
  }

  const passwordErrors = userDAO.validatePasswordComplexity(password);
  if (passwordErrors.length > 0) {
    throw {
      status: 400,
      message: passwordErrors.join(". ") + ".",
    };
  }

  const hashedPassword = await userDAO.hashPassword(password);

  return await userDAO.createUser({
    username,
    email,
    password: hashedPassword,
    role,
  }, tenantId, options);
};

const refreshAccessToken = async (refreshTokenDAO, refreshToken, tenantId) => {
  if (!refreshToken) {
    throw { status: 401, message: "Refresh token is required!" };
  }

  const storedToken = await refreshTokenDAO.findValidRefreshToken(refreshToken, tenantId);
  if (!storedToken) {
    throw { status: 401, message: "Invalid or expired refresh token!" };
  }

  const user = await refreshTokenDAO.findUserById(storedToken.userId);
  if (!user) {
    throw { status: 401, message: "User not found!" };
  }

  const newAccessToken = generateToken(user.id, user.role, user.locale);
  const newRefreshToken = generateRefreshToken();

  if (refreshTokenDAO.createRefreshToken && refreshTokenDAO.revokeRefreshToken) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await refreshTokenDAO.createRefreshToken(user.id, newRefreshToken, expiresAt, tenantId);
    await refreshTokenDAO.revokeRefreshToken(refreshToken, tenantId);
  }

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || {},
    },
  };
};

const revokeRefreshToken = async (refreshTokenDAO, refreshToken, tenantId) => {
  if (!refreshToken) {
    throw { status: 400, message: "Refresh token is required!" };
  }
  return await refreshTokenDAO.revokeRefreshToken(refreshToken, tenantId);
};

const revokeAllUserTokens = async (refreshTokenDAO, userId, tenantId) => {
  return await refreshTokenDAO.revokeAllUserTokens(userId, tenantId);
};

const loginUser = async (userDAO, payload, tenantId, refreshTokenDAO = null, ipAddress = null) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw {
      status: 400,
      message: "Please provide email and password!",
    };
  }

  if (ipAddress) {
    const lockoutCheck = await userDAO.checkLoginLockout(email, ipAddress, tenantId);
    if (lockoutCheck.locked) {
      throw {
        status: 401,
        message: "Invalid credentials!",
        remainingSeconds: lockoutCheck.remainingSeconds,
      };
    }
  }

  const user = await userDAO.findUserByEmail(email, tenantId);

  const isValidPassword = user && await userDAO.comparePassword(
    password,
    user.password
  );

  if (!user || !isValidPassword) {
    if (ipAddress) {
      await userDAO.recordFailedLogin(email, ipAddress, tenantId);
    }
    throw {
      status: 401,
      message: "Invalid credentials!",
    };
  }

  if (ipAddress) {
    await userDAO.clearLoginAttempts(email, ipAddress, tenantId);
  }

  if (user.isSuperAdmin) {
    if (!user.totpEnabled && process.env.TOTP_BYPASS !== "true") {
      throw {
        status: 403,
        message: "Super admin accounts require two-factor authentication. Please contact another super admin to enable TOTP.",
      };
    }
    if (!user.totpConfirmed && user.totpEnabled) {
      const tempToken = jwt.sign(
        { userId: user.id, role: user.role, purpose: "totp_verification" },
        JWT_SECRET,
        { expiresIn: "5m" }
      );
       return {
         pendingTOTP: true,
         tempToken,
         user: {
           id: user.id,
           username: user.username,
           email: user.email,
           role: user.role,
           permissions: user.permissions || {},
           isSuperAdmin: !!user.isSuperAdmin,
           platformRoles: user.platformRoles || [],
         },
       };
    }
  }

  const token = generateToken(user.id, user.role, user.locale);
  const refreshToken = generateRefreshToken();

  let permissions = user.permissions || {};
  try {
    const roleDAO = require("../DAOs/role.dao");
    const effective = await roleDAO.getRolePermissions(user.id, user.tenantId);
    if (effective && Object.keys(effective).length > 0) {
      permissions = effective;
    }
  } catch (err) {
    console.warn("RBAC lookup failed, falling back to inline permissions:", err.message);
  }

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
        manage_audit_logs: true,
        manage_settings: true,
        manage_menu: true,
        view_orders: true,
        edit_orders: true,
        view_appointments: true,
        edit_appointments: true,
        manage_appointments: true,
        manage_stations: true,
        manage_services: true,
        manage_tenants: true,
        view_commissions: true,
        edit_commissions: true,
        view_reports: true,
        manage_platform: true,
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
        manage_audit_logs: true,
        manage_menu: true,
        view_orders: true,
        edit_orders: true,
        view_appointments: true,
        edit_appointments: true,
        manage_appointments: true,
        manage_stations: true,
        manage_services: true,
        manage_tenants: true,
        view_commissions: true,
        edit_commissions: true,
        view_reports: true,
        manage_platform: false,
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
        manage_audit_logs: false,
        manage_menu: true,
        view_orders: true,
        edit_orders: true,
        view_appointments: true,
        edit_appointments: true,
        manage_appointments: false,
        manage_stations: false,
        manage_services: false,
        view_commissions: false,
        edit_commissions: false,
        view_reports: false,
        manage_platform: false,
      },
    };
    permissions = defaults[user.role] || defaults.staff;
  }

  if (refreshTokenDAO) {
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await refreshTokenDAO.createRefreshToken(user.id, refreshToken, expiresAt, tenantId);
    } catch (err) {
      console.warn("Failed to store refresh token:", err.message);
    }
  }

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions,
      isSuperAdmin: !!user.isSuperAdmin,
      platformRoles: user.platformRoles || [],
      emailVerified: !!user.emailVerified,
    },
  };
};

const checkRegistrationStatus = async (settingDAO, tenantId) => {
  const setting = await settingDAO.getSettingByKey("customer_registration_enabled", tenantId);
  if (!setting) {
    return { registrationEnabled: true };
  }
  return { registrationEnabled: setting.value === true || setting.value === "true" };
};

module.exports = {
  generateToken,
  verifyToken,
  verifyRefreshToken,
  generateRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  registerUser,
  loginUser,
  checkRegistrationStatus,
};