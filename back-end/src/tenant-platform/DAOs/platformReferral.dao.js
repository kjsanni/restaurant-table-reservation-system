const db = require("../../db/models");

const platformReferralDAO = {};

platformReferralDAO.listReferrals = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.referrerTenantId) where.referrerTenantId = filters.referrerTenantId;
  if (filters.referredTenantId) where.referredTenantId = filters.referredTenantId;

  const referrals = await db.platformReferral.findAll({
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
  const referral = await db.platformReferral.create(payload);
  return referral.toJSON();
};

platformReferralDAO.updateReferral = async (id, updates) => {
  const referral = await db.platformReferral.findByPk(id);
  if (!referral) return null;
  if (updates.status === "converted" && !referral.convertedAt) {
    updates.convertedAt = new Date();
  }
  await referral.update(updates);
  return referral.toJSON();
};

module.exports = platformReferralDAO;
