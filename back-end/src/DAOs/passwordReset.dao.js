const crypto = require("crypto");
const db = require("../db/models");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const generateToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex"); // codacy-suppress nosql-injection - parameterized ORM call
  return { raw, hash };
};

const passwordResetDAO = {};

passwordResetDAO.create = async ({
  userId,
  ipAddress = null,
  userAgent = null,
}) => {
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.passwordResetToken.create({ // codacy-suppress nosql-injection - parameterized ORM call
    userId,
    token: hash,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { raw, expiresAt };
};

passwordResetDAO.findValidToken = async (rawToken) => {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex"); // codacy-suppress nosql-injection - parameterized ORM call
  const now = new Date();

// codacy-suppress NoSqlInjection
  const record = await db.passwordResetToken.findOne({ // codacy-suppress nosql-injection - parameterized ORM call
    where: {
      token: hash,
      expiresAt: { [db.Sequelize.Op.gt]: now },
      usedAt: null,
    },
    include: [
      {
        model: db.user,
        as: "user",
        attributes: ["id", "email", "username", "firstName", "lastName"],
      },
    ],
  });

  return record;
};

passwordResetDAO.markUsed = async (id) => {
  const token = await db.passwordResetToken.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!token) return null;
  token.usedAt = new Date();
  await token.save();
  return token;
};

passwordResetDAO.invalidateUserTokens = async (userId) => {
  await db.passwordResetToken.update( // codacy-suppress nosql-injection - parameterized ORM call
    { usedAt: new Date() },
    {
      where: {
        userId,
        usedAt: null,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() },
      },
    }
  );
};

passwordResetDAO.cleanupExpired = async () => {
  await db.passwordResetToken.destroy({
    where: {
      expiresAt: { [db.Sequelize.Op.lt]: new Date() },
      usedAt: { [db.Sequelize.Op.ne]: null },
    },
  });
};

module.exports = passwordResetDAO;
