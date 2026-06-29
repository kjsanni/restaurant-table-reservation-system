const db = require("../db/models");
const { Op } = db.Sequelize;
const LoginAttempt = db.loginAttempt;

const recordAttempt = async (email, ipAddress) => {
  return await LoginAttempt.create({
    email,
    ipAddress,
    attemptedAt: new Date(),
  });
};

const countRecentAttempts = async (email, ipAddress, withinMinutes = 15) => {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
  
  const emailAttempts = await LoginAttempt.count({
    where: {
      email,
      attemptedAt: { [Op.gte]: cutoff },
    },
  });

  const ipAttempts = await LoginAttempt.count({
    where: {
      ipAddress,
      attemptedAt: { [Op.gte]: cutoff },
    },
  });

  return {
    emailCount: emailAttempts,
    ipCount: ipAttempts,
  };
};

const clearAttempts = async (email, ipAddress) => {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  await LoginAttempt.destroy({
    where: {
      [Op.or]: [
        { email, attemptedAt: { [Op.gte]: cutoff } },
        { ipAddress, attemptedAt: { [Op.gte]: cutoff } },
      ],
    },
  });
};

const checkLockout = async (email, ipAddress) => {
  const { emailCount, ipCount } = await countRecentAttempts(email, ipAddress);
  const maxAttempts = 5;
  
  if (emailCount >= maxAttempts || ipCount >= maxAttempts) {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
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
