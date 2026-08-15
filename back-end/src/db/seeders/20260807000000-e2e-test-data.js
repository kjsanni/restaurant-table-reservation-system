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
    if (email === "admin@rtrs.com") {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, isSuperAdmin = true, platformRoles = :platformRoles, totpEnabled = false, totpConfirmed = false, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: extra.password, platformRoles: JSON.stringify(["platform_admin"]), now: new Date(), id: existing.id } }
      );
    } else if (email === "akua@demo.test") {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: extra.password, now: new Date(), id: existing.id } }
      );
    } else {
      await queryInterface.sequelize.query(
        "UPDATE users SET password = :password, emailVerified = true, updatedAt = :now WHERE id = :id",
        { replacements: { password: extra.password, now: new Date(), id: existing.id } }
      );
    }
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
      platformRoles: JSON.stringify(["platform_admin"]),
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

    const [existingEvent] = await queryInterface.sequelize.query(
      "SELECT id FROM Events WHERE tenantId = :tenantId AND name = 'Test Event' LIMIT 1",
      { replacements: { tenantId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let eventId;
    if (existingEvent) {
      eventId = existingEvent.id;
    } else {
      const [eventResult] = await queryInterface.sequelize.query(
        `INSERT INTO Events (tenantId, createdById, name, description, eventType, venue, address, eventDate, startTime, endTime, capacity, status, isTicketed, requiresApproval, checkinEnabled, metadata, createdAt, updatedAt)
         VALUES (:tenantId, :createdById, 'Test Event', 'A test event for E2E testing', 'concert', 'Test Venue', '123 Test St', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '18:00:00', '21:00:00', 100, 'published', true, false, false, NULL, NOW(), NOW())`,
        {
          replacements: { tenantId, createdById: 1 },
          type: queryInterface.sequelize.QueryTypes.INSERT,
        }
      );
      eventId = eventResult;
    }

    const [existingTicket] = await queryInterface.sequelize.query(
      "SELECT id FROM TicketTypes WHERE eventId = :eventId AND name = 'General Admission' LIMIT 1",
      { replacements: { eventId }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let ticketTypeId;
    if (existingTicket) {
      ticketTypeId = existingTicket.id;
    } else {
      const [ticketResult] = await queryInterface.sequelize.query(
        `INSERT INTO TicketTypes (tenantId, eventId, name, description, price, currency, quantity, soldCount, isActive, createdAt, updatedAt)
         VALUES (:tenantId, :eventId, 'General Admission', 'Standard entry', 50.00, 'GHS', 100, 0, true, NOW(), NOW())`,
        {
          replacements: { tenantId, eventId },
          type: queryInterface.sequelize.QueryTypes.INSERT,
        }
      );
      ticketTypeId = ticketResult;
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM users WHERE email IN ('admin@rtrs.com', 'akua@demo.test', 'customer@demo.test')"
    );
  },
};
