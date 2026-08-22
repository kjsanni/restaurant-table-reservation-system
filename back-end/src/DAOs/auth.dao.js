const bcrypt = require("bcryptjs");
const db = require("../db/models");
const User = db.user;
const RefreshToken = db.refreshToken;
const Setting = db.setting;

const { normalizeSettingValue } = require("../utils/settings");
const { cache } = require("../utils/cache");

const withTenant = (where = {}, tenantId) => {
  if (!tenantId) {
    console.warn(`[tenant-scoping] ${require("path").basename(module.filename)}: withTenant called without tenantId — tenant filter dropped`);
  }
  return tenantId ? { ...where, tenantId } : where;
};

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
// codacy-suppress NoSqlInjection
  return await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ email }, tenantId),
    order: [["emailVerified", "DESC"]],
  });
};

const findUserByPhone = async (phone, tenantId) => {
  return await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ phone }, tenantId),
  });
};

const findUserById = async (id, tenantId) => {
  return await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
    attributes: ["id", "username", "email", "role", "permissions", "locale", "isSuperAdmin", "platformRoles", "tenantId", "createdAt", "updatedAt"],
  });
};

const createUser = async (userData, tenantId, options = {}) => {
  return await User.create({ // codacy-suppress nosql-injection - parameterized ORM call
    ...userData,
    ...withTenant({}, tenantId),
  }, options);
};

const getAllStaff = async (tenantId) => {
  return await User.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    attributes: ["id", "username", "email", "phone", "role", "permissions", "createdAt"],
    where: withTenant({ role: ["staff", "manager"] }, tenantId),
  });
};

const getAllAdmins = async (tenantId) => {
  return await User.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    attributes: ["id", "username", "email", "role"],
    where: withTenant({ role: "admin" }, tenantId),
  });
};

const getAllUsers = async (tenantId) => {
  return await User.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    attributes: ["id", "username", "email", "role", "createdAt"],
    where: withTenant({}, tenantId),
    order: [["role", "ASC"], ["username", "ASC"]],
  });
};

const getAdminCount = async (tenantId) => {
  return await User.count({ where: withTenant({ role: "admin" }, tenantId) });
};

const createStaffUser = async ({ username, email, password, role, permissions, phone }, tenantId) => {
  const errors = validatePasswordComplexity(password);
  if (errors.length > 0) {
    throw { status: 400, message: errors.join(". ") + "." };
  }
  const hashedPassword = await hashPassword(password);
  return await User.create({ // codacy-suppress nosql-injection - parameterized ORM call
    username,
    email,
    password: hashedPassword,
    role: role || "staff",
    permissions,
    phone,
    ...withTenant({}, tenantId),
  });
};

const updateStaffUser = async (id, updates, tenantId) => {
  const user = await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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
  const allowed = ["username", "email", "password", "role", "permissions", "phone", "firstLoginCompleted"];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      filtered[key] = updates[key];
    }
  }
  return await user.update(filtered); // codacy-suppress nosql-injection - parameterized ORM call
};

const updateUser = async (id, updates, tenantId) => {
  const user = await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  return await user.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
};

const deleteStaffUser = async (id, tenantId) => {
  const user = await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ id }, tenantId),
  });
  if (!user) {
    throw { status: 404, message: "User not found!" };
  }
  return await user.destroy();
};

const getSettingByKey = async (key, tenantId) => {
  const setting = await Setting.findOne({ where: withTenant({ key }, tenantId) }); // codacy-suppress nosql-injection - parameterized ORM call
  if (setting && setting.value !== undefined) {
    setting.value = normalizeSettingValue(setting.value);
  }
  stripSensitiveSettingValue(setting);
  return setting;
};

const getSettingValue = async (key, defaultValue, tenantId) => {
  const cacheKey = `setting:${tenantId || "platform"}:${key}`;
  return await cache.getOrSet(
    cacheKey,
    async () => {
      const setting = await getSettingByKey(key, tenantId);
      if (!setting) return defaultValue;
      return normalizeSettingValue(setting.value);
    },
    300
  );
};

const updateSetting = async (key, value, tenantId) => {
  const [updatedRows] = await Setting.update( // codacy-suppress nosql-injection - parameterized ORM call
    { value: normalizeSettingValue(value) },
    { where: withTenant({ key }, tenantId) }
  );
  if (updatedRows === 0) {
    return await Setting.create({ // codacy-suppress nosql-injection - parameterized ORM call
      key,
      value: normalizeSettingValue(value),
      ...withTenant({}, tenantId),
    });
  }
  await cache.del(`setting:${tenantId || "platform"}:${key}`);
  return await getSettingByKey(key, tenantId);
};

const getPlatformSettingByKey = async (key) => {
  const setting = await Setting.findOne({ where: { key, tenantId: null } }); // codacy-suppress nosql-injection - parameterized ORM call
  if (setting && setting.value !== undefined) {
    setting.value = normalizeSettingValue(setting.value);
  }
  stripSensitiveSettingValue(setting);
  return setting;
};

const updatePlatformSetting = async (key, value) => {
  const [updatedRows] = await Setting.update( // codacy-suppress nosql-injection - parameterized ORM call
    { value: normalizeSettingValue(value) },
    { where: { key, tenantId: null } }
  );
  if (updatedRows === 0) {
    return await Setting.create({ // codacy-suppress nosql-injection - parameterized ORM call
      key,
      value: normalizeSettingValue(value),
      tenantId: null,
    });
  }
  await cache.del(`setting:platform:${key}`);
  return await getPlatformSettingByKey(key);
};

const stripSensitiveSettingValue = (setting) => {
  if (!setting) return setting;
  const key = setting.key || (setting.get && setting.get("key"));
  if (key === "email_server" && setting.value && typeof setting.value === "object") {
    const { ...rest } = setting.value;
    delete rest.pass;
    setting.value = rest;
  }
  if (key === "turnstile_secret_key" && setting.value) {
    setting.value = "[REDACTED]";
  }
  if (key === "erpnext_api_key" && setting.value) {
    setting.value = "[REDACTED]";
  }
  if (key === "erpnext_api_secret" && setting.value) {
    setting.value = "[REDACTED]";
  }
  return setting;
};

const getAllSettings = async (tenantId) => {
  const settings = await Setting.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({}, tenantId),
  });
  settings.forEach((s) => {
    if (s.value !== undefined) s.value = normalizeSettingValue(s.value);
    stripSensitiveSettingValue(s);
  });
  return settings;
};

const createRefreshToken = async (userId, token, expiresAt, tenantId) => {
  return await RefreshToken.create({ // codacy-suppress nosql-injection - parameterized ORM call
    token,
    userId,
    expiresAt,
    ...withTenant({}, tenantId),
  });
};

const findValidRefreshToken = async (token, tenantId) => {
  return await RefreshToken.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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
  const refreshToken = await RefreshToken.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: withTenant({ token }, tenantId),
  });
  if (!refreshToken) return false;
  await refreshToken.update({ isRevoked: true }); // codacy-suppress nosql-injection - parameterized ORM call
  return true;
};

const revokeAllUserTokens = async (userId, tenantId) => {
  await RefreshToken.update( // codacy-suppress nosql-injection - parameterized ORM call
    { isRevoked: true },
    { where: withTenant({ userId, isRevoked: false }, tenantId) }
  );
  return true;
};

const getActiveSessionCount = async (userId, tenantId) => {
  return RefreshToken.count({
    where: withTenant(
      {
        userId,
        isRevoked: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
      tenantId
    ),
  });
};

const revokeOldestSession = async (userId, tenantId) => {
  const oldest = await RefreshToken.findOne({
    where: withTenant(
      {
        userId,
        isRevoked: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
      tenantId
    ),
    order: [["createdAt", "ASC"]],
  });
  if (oldest) {
    await oldest.update({ isRevoked: true });
    return true;
  }
  return false;
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
  return await LoginAttempt.create({ // codacy-suppress nosql-injection - parameterized ORM call
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
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const recentCount = await LoginAttempt.count({
    where: withTenant(
      {
        [Op.or]: [{ email }, { ipAddress }],
        attemptedAt: { [Op.gte]: fifteenMinutesAgo },
      },
      tenantId
    ),
  });

  if (recentCount >= 5) {
    const mostRecent = await LoginAttempt.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
      where: withTenant(
        {
          [Op.or]: [{ email }, { ipAddress }],
          attemptedAt: { [Op.gte]: fifteenMinutesAgo },
        },
        tenantId
      ),
      order: [["attemptedAt", "DESC"]],
    });
    const lockoutEnd = new Date(mostRecent.attemptedAt.getTime() + 15 * 60 * 1000);
    const remainingMs = lockoutEnd - Date.now();
    if (remainingMs > 0) {
      return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
    }
  }

  return { locked: false, remainingSeconds: 0 };
};

const clearLoginAttempts = async (email, ipAddress, tenantId) => {
  const LoginAttempt = db.loginAttempt;
  if (!LoginAttempt) return null;
  const { Op } = db.Sequelize;

  const recentAttempt = await LoginAttempt.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
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

const listPlatformUsers = async ({ limit, offset } = {}) => {
  const { Op } = db.Sequelize;
  const queryOptions = {
    attributes: ["id", "username", "email", "role", "permissions", "locale", "isSuperAdmin", "platformRoles", "tenantId", "createdAt", "updatedAt"],
    where: {
      [Op.or]: [
        { isSuperAdmin: true },
        { tenantId: null, platformRoles: { [Op.ne]: null } },
      ],
    },
    order: [["createdAt", "DESC"]],
  };
  if (limit !== undefined) queryOptions.limit = limit;
  if (offset !== undefined) queryOptions.offset = offset;
  const { rows, count } = await User.findAndCountAll(queryOptions); // codacy-suppress nosql-injection - parameterized ORM call
  return { users: rows, total: count };
};

const findPlatformUserByEmail = async (email) => {
  return await User.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { email, [db.Sequelize.Op.or]: [{ isSuperAdmin: true }, { tenantId: null }] },
  });
};

const createPlatformUser = async ({ username, email, password, role, isSuperAdmin, platformRoles }) => {
  const errors = validatePasswordComplexity(password);
  if (errors.length > 0) {
    throw { status: 400, message: errors.join(". ") + "." };
  }
  const existing = await findPlatformUserByEmail(email);
  if (existing) {
    throw { status: 409, message: "A platform user with this email already exists!" };
  }
  const hashedPassword = await hashPassword(password);
  return await User.create({ // codacy-suppress nosql-injection - parameterized ORM call
    username,
    email,
    password: hashedPassword,
    role: role || "admin",
    isSuperAdmin: isSuperAdmin || false,
    platformRoles: platformRoles || [],
    tenantId: null,
    emailVerified: true,
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
  getAllStaff,
  getAllUsers,
  getAllAdmins,
  getAdminCount,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getSettingByKey,
  getSettingValue,
  updateSetting,
  getAllSettings,
  getPlatformSettingByKey,
  updatePlatformSetting,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  listPlatformUsers,
  findPlatformUserByEmail,
  createPlatformUser,
  recordFailedLogin,
  checkLoginLockout,
  clearLoginAttempts,
  validatePasswordComplexity,
  getActiveSessionCount,
  revokeOldestSession,
};