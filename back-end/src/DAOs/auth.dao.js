const bcrypt = require("bcryptjs");
const db = require("../db/models");
const User = db.user;
const RefreshToken = db.refreshToken;
const Setting = db.setting;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const validatePasswordComplexity = (password) => {
  const errors = [];
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return errors;
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const findUserByEmail = async (email, tenantId) => {
  return await User.findOne({ where: withTenant({ email }, tenantId) });
};

const findUserById = async (id, tenantId) => {
  return await User.findOne({
    where: withTenant({ id }, tenantId),
    attributes: ["id", "username", "email", "role", "permissions", "createdAt", "updatedAt"],
  });
};

const createUser = async (userData, tenantId) => {
  return await User.create({
    ...userData,
    ...withTenant({}, tenantId),
  });
};

const getAllStaff = async (tenantId) => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role", "permissions", "createdAt"],
    where: withTenant({ role: ["staff", "manager"] }, tenantId),
  });
};

const getAllAdmins = async (tenantId) => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role"],
    where: withTenant({ role: "admin" }, tenantId),
  });
};

const getAllUsers = async (tenantId) => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role", "createdAt"],
    where: withTenant({}, tenantId),
    order: [["role", "ASC"], ["username", "ASC"]],
  });
};

const getAdminCount = async (tenantId) => {
  return await User.count({ where: withTenant({ role: "admin" }, tenantId) });
};

const createStaffUser = async ({ username, email, password, role, permissions }, tenantId) => {
  const errors = validatePasswordComplexity(password);
  if (errors.length > 0) {
    throw { status: 400, message: errors.join(". ") + "." };
  }
  const hashedPassword = await hashPassword(password);
  return await User.create({
    username,
    email,
    password: hashedPassword,
    role: role || "staff",
    permissions,
    ...withTenant({}, tenantId),
  });
};

const updateStaffUser = async (id, updates, tenantId) => {
  const user = await User.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  if (updates.password) {
    const errors = validatePasswordComplexity(updates.password);
    if (errors.length > 0) {
      throw { status: 400, message: errors.join(". ") + "." };
    }
    updates.password = await hashPassword(updates.password);
  }
  return await user.update(updates);
};

const deleteStaffUser = async (id, tenantId) => {
  const user = await User.findOne({
    where: withTenant({ id }, tenantId),
  });
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  return await user.destroy();
};

const getSettingByKey = async (key, tenantId) => {
  return await Setting.findOne({ where: withTenant({ key }, tenantId) });
};

const updateSetting = async (key, value, tenantId) => {
  const [updatedRows] = await Setting.update(
    { value },
    { where: withTenant({ key }, tenantId) }
  );
  if (updatedRows === 0) {
    return await Setting.create({ key, value, ...withTenant({}, tenantId) });
  }
  return await getSettingByKey(key, tenantId);
};

const getAllSettings = async (tenantId) => {
  return await Setting.findAll({
    where: withTenant({}, tenantId),
  });
};

const createRefreshToken = async (userId, token, expiresAt, tenantId) => {
  return await RefreshToken.create({
    token,
    userId,
    expiresAt,
    ...withTenant({}, tenantId),
  });
};

const findValidRefreshToken = async (token, tenantId) => {
  return await RefreshToken.findOne({
    where: withTenant(
      {
        token,
        isRevoked: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
      tenantId
    ),
  });
};

const revokeRefreshToken = async (token, tenantId) => {
  const refreshToken = await RefreshToken.findOne({
    where: withTenant({ token }, tenantId),
  });
  if (!refreshToken) return false;
  await refreshToken.update({ isRevoked: true });
  return true;
};

const revokeAllUserTokens = async (userId, tenantId) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: withTenant({ userId, isRevoked: false }, tenantId) }
  );
  return true;
};

const cleanupExpiredTokens = async (tenantId) => {
  await RefreshToken.destroy({
    where: withTenant(
      {
        expiresAt: { [db.Sequelize.Op.lt]: new Date() },
      },
      tenantId
    ),
  });
};

const recordFailedLogin = async (email, ipAddress, tenantId) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return null;
  return await LoginAttempt.create({
    email,
    ipAddress,
    attemptedAt: new Date(),
    ...withTenant({}, tenantId),
  });
};

const checkLoginLockout = async (email, ipAddress, tenantId) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return { locked: false, remainingSeconds: 0 };

  const { Op } = db.Sequelize;

  const recentAttempt = await LoginAttempt.findOne({
    where: withTenant(
      {
        [Op.or]: [{ email }, { ipAddress }],
      },
      tenantId
    ),
    order: [["attemptedAt", "DESC"]],
  });

  if (!recentAttempt) {
    return { locked: false, remainingSeconds: 0 };
  }

  const lockoutEnd = new Date(recentAttempt.attemptedAt.getTime() + 15 * 60 * 1000);
  const remainingMs = lockoutEnd - Date.now();
  if (remainingMs > 0) {
    const recentCount = await LoginAttempt.count({
      where: withTenant(
        {
          [Op.or]: [{ email }, { ipAddress }],
          attemptedAt: { [Op.gte]: new Date(recentAttempt.attemptedAt.getTime() - 15 * 60 * 1000) },
        },
        tenantId
      ),
    });
    if (recentCount >= 5) {
      return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
    }
  }

  return { locked: false, remainingSeconds: 0 };
};

const clearLoginAttempts = async (email, ipAddress, tenantId) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return null;
  const { Op } = db.Sequelize;

  const recentAttempt = await LoginAttempt.findOne({
    where: withTenant(
      {
        [Op.or]: [{ email }, { ipAddress }],
      },
      tenantId
    ),
    order: [["attemptedAt", "DESC"]],
  });

  if (!recentAttempt) return 0;

  const cutoff = new Date(recentAttempt.attemptedAt.getTime() - 15 * 60 * 1000);
  return await LoginAttempt.destroy({
    where: withTenant(
      {
        [Op.or]: [{ email }, { ipAddress }],
        attemptedAt: { [Op.lte]: cutoff },
      },
      tenantId
    ),
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  findUserByEmail,
  findUserById,
  createUser,
  getAllStaff,
  getAllUsers,
  getAllAdmins,
  getAdminCount,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getSettingByKey,
  updateSetting,
  getAllSettings,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  recordFailedLogin,
  checkLoginLockout,
  clearLoginAttempts,
  validatePasswordComplexity,
};