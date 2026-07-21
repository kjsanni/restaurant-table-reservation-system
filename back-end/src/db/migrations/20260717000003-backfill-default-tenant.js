"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [tenant] = await queryInterface.sequelize.query(
      `SELECT id FROM tenants WHERE id = 1 LIMIT 1`
    );

    if (!tenant || tenant.length === 0) {
      await queryInterface.sequelize.query(
        `INSERT INTO tenants (id, name, slug, status, plan, subscriptionStatus, createdAt, updatedAt) VALUES (1, 'Default Tenant', 'default', 'active', 'starter', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      );
    }

    const tables = [
      "users",
      "Customers",
      "Reservations",
      "Tables",
      "payments",
      "waitlist",
      "AuditLogs",
      "settings",
      "Schedule",
      "holidays",
      "ReservationStatusHistory",
      "Refunds",
      "EmailTemplates",
      "PermissionTemplates",
      "Shifts",
      "TimeOffs",
      "TableEvents",
      "FloorPlans",
    ];

    for (const table of tables) {
      try {
        await queryInterface.sequelize.query(
          `UPDATE ${table} SET tenantId = 1 WHERE tenantId IS NULL`
        );
      } catch (err) {
        console.log(`Skip backfill ${table}: ${err.message}`);
      }
    }

    const junctionTables = ["user_groups", "table_staff", "reservation_staff"];
    for (const jt of junctionTables) {
      try {
        await queryInterface.sequelize.query(
          `UPDATE ${jt} SET tenantId = 1 WHERE tenantId IS NULL`
        );
      } catch (err) {
        console.log(`Skip backfill ${jt}: ${err.message}`);
      }
    }
  },

  down: async () => {
    // No rollback for data backfill
  },
};
