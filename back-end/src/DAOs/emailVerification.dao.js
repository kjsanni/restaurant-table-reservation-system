const db = require("../db/models");

const emailVerificationDAO = {};

emailVerificationDAO.create = async ({ userId, email }) => {
  const { generateToken } = require("../services/authService");
  const { Op } = require("sequelize");

  await db.emailVerification.update(
    { usedAt: new Date() },
    { where: { userId, usedAt: { [Op.eq]: null } } }
  );

  const raw = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return db.emailVerification.create({
    userId,
    email,
    token: raw,
    expiresAt,
  });
};

// codacy-ignore
emailVerificationDAO.findValidToken = async (rawToken) => {
  return db.emailVerification.findOne({
    where: { token: rawToken, usedAt: null, expiresAt: { [require("sequelize").Op.gt]: new Date() } },
    include: [{ model: db.user, as: "user" }],
  });
};

emailVerificationDAO.markUsed = async (id) => {
  const token = await db.emailVerification.findByPk(id);
  if (token) {
    token.usedAt = new Date();
    await token.save();
  }
  return token;
};

emailVerificationDAO.invalidateUserTokens = async (userId) => {
  await db.emailVerification.update(
    { usedAt: new Date() },
    { where: { userId, usedAt: { [require("sequelize").Op.eq]: null } } }
  );
};

emailVerificationDAO.cleanupExpired = async () => {
  await db.emailVerification.destroy({
    where: { expiresAt: { [require("sequelize").Op.lt]: new Date() } },
  });
};

module.exports = emailVerificationDAO;
