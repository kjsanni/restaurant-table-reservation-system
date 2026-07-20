"use strict";

/**
 * MySQL hardening for the Payments table (Phase 3).
 *
 * This migration originally intended to partition `payments` by
 * `LINEAR KEY(tenantId)`. That is not applicable and is unsafe on this schema:
 *
 *   1. Partitioning requires a composite PK `(id, tenantId)`, which would
 *      break the FK `payments_ibfk_1` referencing `reservations(id)` and
 *      change every downstream access pattern. It also provides no real
 *      benefit at current data volumes.
 *
 *   2. `tenantId` must stay NULLABLE: the FK
 *      `Payments_tenantId_foreign_idx` is defined `ON DELETE SET NULL`, which
 *      requires the column to remain nullable. Forcing `NOT NULL` fails with
 *      "Column 'tenantId' cannot be NOT NULL: needed in a foreign key
 *       constraint ... SET NULL".
 *
 * What this migration actually does (safe + idempotent):
 *   - Backfills any legacy rows that still have `tenantId IS NULL` to the
 *     default tenant (id = 1) so every payment is attributable.
 *   - Leaves the column NULLABLE and the table unpartitioned, matching the
 *     real access pattern. Tenant scoping is enforced in queries/DAOs.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Attract every legacy payment to the default tenant (id = 1).
    // Idempotent: rows that already have a tenantId are untouched.
    await sequelize.query(`
      UPDATE payments
        SET tenantId = 1
        WHERE tenantId IS NULL;
    `);
  },

  async down() {
    const sequelize = queryInterface.sequelize;
    // No destructive change: leave payments attributed to the default tenant.
    await sequelize.query(`
      SELECT 1;
    `);
  },
};
