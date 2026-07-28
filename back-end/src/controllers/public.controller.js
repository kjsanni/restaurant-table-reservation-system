const db = require("../db/models");
const planDAO = require("../tenant-platform/DAOs/plan.dao");

const listPublicPlansHandler = async (req, res) => {
  const plans = await planDAO.findAll({ isActive: true });
  const sanitized = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    maxTables: plan.maxTables,
    maxReservationsPerMonth: plan.maxReservationsPerMonth,
    sortOrder: plan.sortOrder,
  }));
  return res.status(200).json({ success: true, plans: sanitized });
};

module.exports = {
  listPublicPlansHandler,
};
