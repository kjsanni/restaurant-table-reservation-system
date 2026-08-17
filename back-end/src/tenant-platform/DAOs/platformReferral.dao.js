const db = require("../../db/models");

const platformReferralDAO = {};

platformReferralDAO.listReferrals = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.referrerTenantId) where.referrerTenantId = filters.referrerTenantId;
  if (filters.referredTenantId) where.referredTenantId = filters.referredTenantId;

  const referrals = await db.platformReferral.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where,
    include: [
      { model: db.tenant, as: "referrer", attributes: ["id", "name", "slug"] },
      { model: db.tenant, as: "referred", attributes: ["id", "name", "slug"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return referrals.map((r) => r.toJSON());
};

platformReferralDAO.createReferral = async (payload) => {
  const referral = await db.platformReferral.create(payload); // codacy-suppress nosql-injection - parameterized ORM call
  return referral.toJSON();
};

platformReferralDAO.updateReferral = async (id, updates) => {
  const referral = await db.platformReferral.findByPk(id); // codacy-suppress nosql-injection - parameterized ORM call
  if (!referral) return null;
  if (updates.status === "converted" && !referral.convertedAt) {
    updates.convertedAt = new Date();
  }
  await referral.update(updates); // codacy-suppress nosql-injection - parameterized ORM call
  return referral.toJSON();
};

module.exports = platformReferralDAO;
