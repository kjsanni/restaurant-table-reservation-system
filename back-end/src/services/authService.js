const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verifyTokenWithFallback, getCurrentSecret } = require("../utils/jwtRotation");

const JWT_SECRET = getCurrentSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const verifyToken = (token) => {
  return verifyTokenWithFallback(token);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || getCurrentSecret());
};

const registerUser = async (userDAO, payload) => {
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
    role: "staff",
  });
};

const refreshAccessToken = async (refreshTokenDAO, refreshToken) => {
  if (!refreshToken) {
    throw { status: 401, message: "Refresh token is required!" };
  }

  const storedToken = await refreshTokenDAO.findValidRefreshToken(refreshToken);
  if (!storedToken) {
    throw { status: 401, message: "Invalid or expired refresh token!" };
  }

  const user = await refreshTokenDAO.findUserById(storedToken.userId);
  if (!user) {
    throw { status: 401, message: "User not found!" };
  }

  const newAccessToken = generateToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken();

  if (refreshTokenDAO.createRefreshToken && refreshTokenDAO.revokeRefreshToken) {
    try {
      await refreshTokenDAO.revokeRefreshToken(refreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await refreshTokenDAO.createRefreshToken(user.id, newRefreshToken, expiresAt);
    } catch (err) {
      console.warn("Failed to rotate refresh token:", err.message);
    }
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

const revokeRefreshToken = async (refreshTokenDAO, refreshToken) => {
  if (!refreshToken) {
    throw { status: 400, message: "Refresh token is required!" };
  }
  return await refreshTokenDAO.revokeRefreshToken(refreshToken);
};

const revokeAllUserTokens = async (refreshTokenDAO, userId) => {
  return await refreshTokenDAO.revokeAllUserTokens(userId);
};

const loginUser = async (userDAO, payload, refreshTokenDAO = null, ipAddress = null) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw {
      status: 400,
      message: "Please provide email and password!",
    };
  }

  if (ipAddress) {
    const lockoutCheck = await userDAO.checkLoginLockout(email, ipAddress);
    if (lockoutCheck.locked) {
      throw {
        status: 401,
        message: "Invalid credentials!",
        remainingSeconds: lockoutCheck.remainingSeconds,
      };
    }
  }

  const user = await userDAO.findUserByEmail(email);

  const isValidPassword = user && await userDAO.comparePassword(
    password,
    user.password
  );

  if (!user || !isValidPassword) {
    if (ipAddress) {
      await userDAO.recordFailedLogin(email, ipAddress);
    }
    throw {
      status: 401,
      message: "Invalid credentials!",
    };
  }

  if (ipAddress) {
    await userDAO.clearLoginAttempts(email, ipAddress);
  }

  const token = generateToken(user.id, user.role);
  const refreshToken = generateRefreshToken();

  let permissions = user.permissions || {};
  try {
    const roleDAO = require("../DAOs/role.dao");
    const effective = await roleDAO.getRolePermissions(user.id);
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
    permissions = defaults[user.role] || defaults.staff;
  }

  if (refreshTokenDAO) {
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await refreshTokenDAO.createRefreshToken(user.id, refreshToken, expiresAt);
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
    },
  };
};

const checkRegistrationStatus = async (settingDAO) => {
  const setting = await settingDAO.getSettingByKey("customer_registration_enabled");
  if (!setting) {
    return { registrationEnabled: true };
  }
  return { registrationEnabled: setting.value === "true" };
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