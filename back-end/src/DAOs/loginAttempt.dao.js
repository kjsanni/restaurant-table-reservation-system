const db = require("../db/models");
const { Op } = db.Sequelize;
const LoginAttempt = db.loginAttempt;

const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : {});

const recordAttempt = async (email, ipAddress, tenantId) => {
  return await LoginAttempt.create({
    email,
    ipAddress,
    attemptedAt: new Date(),
    ...withTenant({}, tenantId),
  });
};

const countRecentAttempts = async (email, ipAddress, withinMinutes = 15, tenantId) => {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);

  const emailAttempts = await LoginAttempt.count({
    where: withTenant({
      email,
      attemptedAt: { [Op.gte]: cutoff },
    }, tenantId),
  });

  const ipAttempts = await LoginAttempt.count({
    where: withTenant({
      ipAddress,
      attemptedAt: { [Op.gte]: cutoff },
    }, tenantId),
  });

  return {
    emailCount: emailAttempts,
    ipCount: ipAttempts,
  };
};

const clearAttempts = async (email, ipAddress, tenantId) => {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  await LoginAttempt.destroy({
    where: withTenant({
      [Op.or]: [
        { email, attemptedAt: { [Op.gte]: cutoff } },
        { ipAddress, attemptedAt: { [Op.gte]: cutoff } },
      ],
    }, tenantId),
  });
};

const checkLockout = async (email, ipAddress, tenantId) => {
  const { emailCount, ipCount } = await countRecentAttempts(email, ipAddress, 15, tenantId);
  const maxAttempts = 5;

  if (emailCount >= maxAttempts || ipCount >= maxAttempts) {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const mostRecent = await LoginAttempt.findOne({
      where: withTenant({
        [Op.or]: [{ email }, { ipAddress }],
        attemptedAt: { [Op.gte]: cutoff },
      }, tenantId),
      order: [["attemptedAt", "DESC"]],
    });

    if (mostRecent) {
      const lockoutEnd = new Date(mostRecent.attemptedAt.getTime() + 15 * 60 * 1000);
      const remainingMs = lockoutEnd - Date.now();
      if (remainingMs > 0) {
        return {
          locked: true,
          remainingSeconds: Math.ceil(remainingMs / 1000),
        };
      }
    }
  }

  return { locked: false, remainingSeconds: 0 };
};

module.exports = {
  recordAttempt,
  countRecentAttempts,
  clearAttempts,
  checkLockout,
};
