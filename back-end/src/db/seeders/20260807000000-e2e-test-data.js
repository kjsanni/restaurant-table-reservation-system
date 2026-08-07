"use strict";

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {
    const [defaultTenant] = await queryInterface.sequelize.query(
      "SELECT id FROM tenants WHERE slug = 'default' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const [anyTenant] = await queryInterface.sequelize.query(
      "SELECT id FROM tenants LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const tenantId = defaultTenant?.id || anyTenant?.id || 1;
    const now = new Date();

    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const staffPasswordHash = await bcrypt.hash("password123", 10);
    const customerPasswordHash = await bcrypt.hash("customer123", 10);

    const [existingAdmin] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@rtrs.com' AND tenantId = :tenantId LIMIT 1",
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin) {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, isSuperAdmin = true, totpEnabled = false, totpConfirmed = false, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: adminPasswordHash, now, id: existingAdmin.id } }
      );
    } else {
      await queryInterface.bulkInsert("users", [
        {
          username: "admin",
          email: "admin@rtrs.com",
          password: adminPasswordHash,
          role: "admin",
          tenantId,
          isSuperAdmin: true,
          totpEnabled: false,
          totpConfirmed: false,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    const [existingStaff] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'akua@demo.test' AND tenantId = :tenantId LIMIT 1",
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingStaff) {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: staffPasswordHash, now, id: existingStaff.id } }
      );
    } else {
      await queryInterface.bulkInsert("users", [
        {
          username: "akua Mensah",
          email: "akua@demo.test",
          password: staffPasswordHash,
          role: "staff",
          tenantId,
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
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    const [existingCustomer] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'customer@demo.test' AND tenantId = :tenantId LIMIT 1",
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingCustomer) {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: customerPasswordHash, now, id: existingCustomer.id } }
      );
    } else {
      await queryInterface.bulkInsert("users", [
        {
          username: "Test Customer",
          email: "customer@demo.test",
          password: customerPasswordHash,
          role: "customer",
          tenantId,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM users WHERE email IN ('admin@rtrs.com', 'akua@demo.test', 'customer@demo.test')"
    );
  },
};
