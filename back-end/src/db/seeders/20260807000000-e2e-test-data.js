"use strict";

const bcrypt = require("bcryptjs");

const resolveTenantId = async (queryInterface) => {
  const [defaultTenant] = await queryInterface.sequelize.query(
    "SELECT id FROM tenants WHERE slug = 'default' LIMIT 1",
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  const [anyTenant] = await queryInterface.sequelize.query(
    "SELECT id FROM tenants LIMIT 1",
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  return defaultTenant?.id || anyTenant?.id || 1;
};

const ensureUser = async (queryInterface, tenantId, email, role, extra = {}) => {
  const [existing] = await queryInterface.sequelize.query(
    "SELECT id FROM users WHERE email = :email AND tenantId = :tenantId LIMIT 1",
    { replacements: { email, tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  if (existing) {
    const setClause = Object.keys(extra)
      .map((k) => `${k} = :${k}`)
      .join(", ");
    await queryInterface.sequelize.query(
      `UPDATE users SET ${setClause}, updatedAt = :now WHERE id = :id`,
      { replacements: { ...extra, now: new Date(), id: existing.id } }
    );
  } else {
    await queryInterface.bulkInsert("users", [
      {
        email,
        role,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...extra,
      },
    ]);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const tenantId = await resolveTenantId(queryInterface);
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const staffPasswordHash = await bcrypt.hash("password123", 10);
    const customerPasswordHash = await bcrypt.hash("customer123", 10);

    await ensureUser(queryInterface, tenantId, "admin@rtrs.com", "admin", {
      username: "admin",
      password: adminPasswordHash,
      isSuperAdmin: true,
      totpEnabled: false,
      totpConfirmed: false,
      emailVerified: true,
    });

    await ensureUser(queryInterface, tenantId, "akua@demo.test", "staff", {
      username: "akua Mensah",
      password: staffPasswordHash,
      emailVerified: true,
      permissions: JSON.stringify({
        view_reservations: true,
        edit_reservations: true,
        manage_tables: true,
        manage_schedule: true,
        manage_staff: true,
        view_appointments: true,
        edit_appointments: true,
        manage_stations: true,
        manage_services: true,
      }),
    });

    await ensureUser(queryInterface, tenantId, "customer@demo.test", "customer", {
      username: "Test Customer",
      password: customerPasswordHash,
      emailVerified: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM users WHERE email IN ('admin@rtrs.com', 'akua@demo.test', 'customer@demo.test')"
    );
  },
};
