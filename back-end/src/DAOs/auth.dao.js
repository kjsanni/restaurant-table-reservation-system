const bcrypt = require("bcryptjs");
const db = require("../db/models");
const User = db.user;
const RefreshToken = db.refreshToken;
const Setting = db.setting;

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

const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

const findUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: ["id", "username", "email", "role", "permissions", "createdAt", "updatedAt"],
  });
};

const createUser = async (userData) => {
  return await User.create(userData);
};

const getAllStaff = async () => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role", "permissions", "createdAt"],
    where: {
      role: ["staff", "manager"],
    },
  });
};

const getAllAdmins = async () => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role"],
    where: {
      role: "admin",
    },
  });
};

const getAllUsers = async () => {
  return await User.findAll({
    attributes: ["id", "username", "email", "role", "createdAt"],
    order: [["role", "ASC"], ["username", "ASC"]],
  });
};

const getAdminCount = async () => {
  return await User.count({ where: { role: "admin" } });
};

const createStaffUser = async ({ username, email, password, role, permissions }) => {
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
  });
};

const updateStaffUser = async (id, updates) => {
  const user = await User.findByPk(id);
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

const deleteStaffUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  return await user.destroy();
};

const getSettingByKey = async (key) => {
  return await Setting.findOne({ where: { key } });
};

const updateSetting = async (key, value) => {
  const [updatedRows] = await Setting.update(
    { value },
    { where: { key } }
  );
  if (updatedRows === 0) {
    return await Setting.create({ key, value });
  }
  return await getSettingByKey(key);
};

const getAllSettings = async () => {
  return await Setting.findAll();
};

const createRefreshToken = async (userId, token, expiresAt) => {
  return await RefreshToken.create({
    token,
    userId,
    expiresAt,
  });
};

const findValidRefreshToken = async (token) => {
  return await RefreshToken.findOne({
    where: {
      token,
      isRevoked: false,
      expiresAt: { [db.Sequelize.Op.gt]: new Date() },
    },
  });
};

const revokeRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ where: { token } });
  if (!refreshToken) return false;
  await refreshToken.update({ isRevoked: true });
  return true;
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );
  return true;
};

const cleanupExpiredTokens = async () => {
  await RefreshToken.destroy({
    where: {
      expiresAt: { [db.Sequelize.Op.lt]: new Date() },
    },
  });
};

const recordFailedLogin = async (email, ipAddress) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return null;
  return await LoginAttempt.create({
    email,
    ipAddress,
    attemptedAt: new Date(),
  });
};

const checkLoginLockout = async (email, ipAddress) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return { locked: false, remainingSeconds: 0 };

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const { Op } = db.Sequelize;

  const emailAttempts = await LoginAttempt.count({
    where: { email, attemptedAt: { [Op.gte]: cutoff } },
  });

  const ipAttempts = await LoginAttempt.count({
    where: { ipAddress, attemptedAt: { [Op.gte]: cutoff } },
  });

  const maxAttempts = 5;
  if (emailAttempts >= maxAttempts || ipAttempts >= maxAttempts) {
    const mostRecent = await LoginAttempt.findOne({
      where: {
        [Op.or]: [{ email }, { ipAddress }],
        attemptedAt: { [Op.gte]: cutoff },
      },
      order: [["attemptedAt", "DESC"]],
    });

    if (mostRecent) {
      const lockoutEnd = new Date(mostRecent.attemptedAt.getTime() + 15 * 60 * 1000);
      const remainingMs = lockoutEnd - Date.now();
      if (remainingMs > 0) {
        return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
      }
    }
  }

  return { locked: false, remainingSeconds: 0 };
};

const clearLoginAttempts = async (email, ipAddress) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return null;
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const { Op } = db.Sequelize;
  return await LoginAttempt.destroy({
    where: {
      [Op.or]: [
        { email, attemptedAt: { [Op.gte]: cutoff } },
        { ipAddress, attemptedAt: { [Op.gte]: cutoff } },
      ],
    },
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