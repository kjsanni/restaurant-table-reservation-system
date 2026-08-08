const db = require("../../db/models");

const tenantMigrationDAO = {};

tenantMigrationDAO.exportTenant = async (tenantId) => {
  const tenant = await db.tenant.findByPk(tenantId, {
    include: [
      {
        model: db.user,
        as: "users",
        attributes: { exclude: ["password"] },
      },
      {
        model: db.customer,
        as: "customers",
      },
      {
        model: db.reservation,
        as: "reservations",
        include: [
          { model: db.payment, as: "payments" },
          { model: db.order, as: "orders" },
        ],
      },
      {
        model: db.note,
        as: "notes",
      },
      {
        model: db.legalAcceptance,
        as: "legalAcceptances",
      },
    ],
  });

  if (!tenant) return null;

  const settings = await db.setting.findAll({
    where: { tenantId },
    attributes: ["key", "value", "updatedAt"],
  });

  return {
    exportedAt: new Date().toISOString(),
    tenant: tenant.toJSON(),
    settings: settings.map((s) => ({ key: s.key, value: s.value, updatedAt: s.updatedAt })),
    notes: tenant.notes || [],
    legalAcceptances: tenant.legalAcceptances || [],
    reservations: tenant.reservations || [],
    customers: tenant.customers || [],
    users: tenant.users || [],
  };
};

tenantMigrationDAO.importTenant = async (payload, options = {}) => {
  const { targetTenantId, mode = "create" } = options;
  const { tenant: sourceTenant, settings, _notes, _legalAcceptances, reservations, customers, users } = payload;

  if (mode === "create") {
    const newTenant = await db.tenant.create({
      name: sourceTenant.name,
      plan: sourceTenant.plan,
      status: "active",
      settings: sourceTenant.settings,
    });
    return await tenantMigrationDAO.importTenant({ ...payload, tenant: sourceTenant }, { targetTenantId: newTenant.id, mode: "merge" });
  }

  if (!targetTenantId) {
    throw new Error("targetTenantId is required for merge mode");
  }

  const targetTenant = await db.tenant.findByPk(targetTenantId);
  if (!targetTenant) {
    throw new Error("Target tenant not found");
  }

  const results = { importedUsers: 0, importedCustomers: 0, importedReservations: 0, importedSettings: 0, skipped: 0 };

  for (const user of users || []) {
    const exists = await db.user.findOne({ where: { email: user.email, tenantId: targetTenantId } });
    if (exists) { results.skipped++; continue; }
    await db.user.create({ ...user, tenantId: targetTenantId, password: undefined });
    results.importedUsers++;
  }

  for (const customer of customers || []) {
    const exists = await db.customer.findOne({ where: { email: customer.email, tenantId: targetTenantId } });
    if (exists) { results.skipped++; continue; }
    await db.customer.create({ ...customer, tenantId: targetTenantId });
    results.importedCustomers++;
  }

  for (const setting of settings || []) {
    await db.setting.upsert({ tenantId: targetTenantId, key: setting.key, value: setting.value });
    results.importedSettings++;
  }

  for (const reservation of reservations || []) {
    const _r = await db.reservation.create({ ...reservation, tenantId: targetTenantId });
    results.importedReservations++;
  }

  return { success: true, targetTenantId, results };
};

module.exports = tenantMigrationDAO;
