const db = require("../../db/models");
const { sendMail } = require("../../services/mail.service");

const bulkDAO = {};

bulkDAO.suspendTenants = async (tenantIds, reason) => {
  const now = new Date();
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    await t.update({ status: "suspended", suspendedAt: now, suspendedReason: reason || "Bulk suspend" }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.length;
};

bulkDAO.changePlan = async (tenantIds, newPlan) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    await t.update({ plan: newPlan }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.length;
};

bulkDAO.sendEmail = async (tenantIds, subject, body) => {
  const tenants = await db.tenant.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { id: { [db.Sequelize.Op.in]: tenantIds } },
    attributes: ["id", "name", "billingEmail"],
  });
  const results = [];
  for (const t of tenants) {
    if (t.billingEmail) {
      try {
        await sendMail(t.billingEmail, "billing_notification", {
          subject,
          body,
          tenantName: t.name,
        }, t.id);
        results.push({ tenantId: t.id, email: t.billingEmail, sent: true });
      } catch (err) {
        results.push({ tenantId: t.id, email: t.billingEmail, sent: false, error: err.message });
      }
    }
  }
  return results;
};

bulkDAO.changeVertical = async (tenantIds, vertical) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    await t.update({ businessVertical: vertical }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.map((t) => ({ id: t.id, name: t.name, businessVertical: t.businessVertical }));
};

bulkDAO.enableTenants = async (tenantIds) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds }, status: "suspended" } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    await t.update({ status: "active", suspendedAt: null, suspendedReason: null }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.length;
};

bulkDAO.exportTenants = async (tenantIds) => {
  const tenants = await db.tenant.findAll({ // codacy-suppress nosql-injection - parameterized ORM call
    where: { id: { [db.Sequelize.Op.in]: tenantIds } },
    attributes: ["id", "name", "slug", "domain", "status", "plan", "businessVertical", "billingEmail", "currency", "createdAt", "updatedAt"],
  });
  return tenants.map((t) => t.toJSON());
};

bulkDAO.assignFeatureFlags = async (tenantIds, featureFlags) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    const settings = t.settings || {};
    settings.featureFlags = { ...(settings.featureFlags || {}), ...featureFlags };
    await t.update({ settings }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.length;
};

bulkDAO.deleteTenants = async (tenantIds) => {
  const tenants = await db.tenant.findAll({ where: { id: { [db.Sequelize.Op.in]: tenantIds } } }); // codacy-suppress nosql-injection - parameterized ORM call
  for (const t of tenants) {
    await t.update({ status: "cancelled" }); // codacy-suppress nosql-injection - parameterized ORM call
  }
  return tenants.length;
};

bulkDAO.bulkProvision = async (tenantIds) => {
  const provisioningService = require("../services/provisioning.service");
  const results = await Promise.allSettled(
    tenantIds.map(async (tenantId) => {
      try {
        const pipeline = await provisioningService.startProvisioning(tenantId, null);
        return { tenantId, status: pipeline.status, error: pipeline.error || null };
      } catch (err) {
        return { tenantId, status: "failed", error: err.message };
      }
    })
  );

  return results.map((r) => r.value || r.reason);
};

module.exports = bulkDAO;
