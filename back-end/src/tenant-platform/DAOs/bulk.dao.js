const db = require("../../db/models");

const bulkDAO = {};

bulkDAO.suspendTenants = async (tenantIds, reason) => {
  const now = new Date();
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } });
  for (const t of tenants) {
    await t.update({ status: "suspended", suspendedAt: now, suspendedReason: reason || "Bulk suspend" });
  }
  return tenants.length;
};

bulkDAO.changePlan = async (tenantIds, newPlan) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } });
  for (const t of tenants) {
    await t.update({ plan: newPlan });
  }
  return tenants.length;
};

bulkDAO.sendEmail = async (tenantIds, subject, body) => {
  const tenants = await db.tenant.findAll({
    where: { id: { [db.Sequelize.Op.in]: tenantIds } },
    attributes: ["id", "name", "billingEmail"],
  });
  const results = [];
  for (const t of tenants) {
    if (t.billingEmail) {
      results.push({ tenantId: t.id, email: t.billingEmail, sent: true });
    }
  }
  return results;
};

module.exports = bulkDAO;
