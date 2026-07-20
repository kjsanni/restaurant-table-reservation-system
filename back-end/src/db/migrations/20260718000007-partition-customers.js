"use strict";

/**
 * MySQL hardening for the Customers table (Phase 3).
 *
 * This migration originally intended to partition `Customers` by
 * `LINEAR KEY(tenantId)`. That is not applicable and is unsafe on this schema:
 *
 *   1. Partitioning requires a composite PK `(id, tenantId)`, which would
 *      change the `(tenantId, email)` unique key and every downstream access
 *      pattern, with no real benefit at current data volumes.
 *
 *   2. `tenantId` must stay NULLABLE: the FK
 *      `Customers_tenantId_foreign_idx` is defined `ON DELETE SET NULL`, which
 *      requires the column to remain nullable. Forcing `NOT NULL` fails with
 *      "Column 'tenantId' cannot be NOT NULL: needed in a foreign key
 *       constraint ... SET NULL".
 *
 * What this migration actually does (safe + idempotent):
 *   - Backfills any legacy rows that still have `tenantId IS NULL` to the
 *     default tenant (id = 1) so every customer is attributable.
 *   - Leaves the column NULLABLE and the table unpartitioned. Tenant scoping
 *     is enforced in queries/DAOs.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Attract every legacy customer to the default tenant (id = 1).
    // Idempotent: rows that already have a tenantId are untouched.
    await sequelize.query(`
      UPDATE Customers
        SET tenantId = 1
        WHERE tenantId IS NULL;
    `);
  },

  async down() {
    const sequelize = queryInterface.sequelize;
    // No destructive change: leave customers attributed to the default tenant.
    await sequelize.query(`
      SELECT 1;
    `);
  },
};
