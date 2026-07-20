"use strict";

/**
 * Reservations scaling optimization (Phase 3).
 *
 * Original intent was to make `tenantId` NOT NULL and partition `Reservations`
 * by `LINEAR KEY(tenantId)` for 100k-tenant / 1M-customer scale. Neither is
 * actually applicable, and both are unsafe on this schema:
 *
 *   1. Partitioning is impossible: MySQL 8.0 cannot partition a table that
 *      carries a FULLTEXT index. `Reservations` has `notes_fulltext_idx`, so
 *      any `ALTER TABLE ... PARTITION BY` fails with
 *      "The used table type doesn't support FULLTEXT indexes". A composite PK
 *      `(id, tenantId)` would also break every FK referencing `Reservations(id)`
 *      and is unnecessary — tenant scoping is already enforced in queries/DAOs.
 *
 *   2. `tenantId` must stay NULLABLE: the FK
 *      `Reservations_tenantId_foreign_idx` is defined
 *      `ON DELETE SET NULL`, which requires the column to remain nullable.
 *      Forcing `NOT NULL` therefore fails with
 *      "Column 'tenantId' cannot be NOT NULL: needed in a foreign key
 *       constraint ... SET NULL".
 *
 * What this migration actually does (safe + idempotent):
 *   - Backfills any legacy rows that still have `tenantId IS NULL` to the
 *     default tenant (id = 1) so every reservation is attributable.
 *   - Leaves the column NULLABLE and the table unpartitioned, matching the
 *     real (non-partitioned, single-tenant-and-multi-tenant) access pattern.
 *
 * Partitioning can be revisited only if FULLTEXT search is moved off this
 * table and the FK is changed to ON DELETE RESTRICT.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Attract every legacy reservation to the default tenant (id = 1).
    // Idempotent: rows that already have a tenantId are untouched.
    await sequelize.query(`
      UPDATE Reservations
        SET tenantId = 1
        WHERE tenantId IS NULL;
    `);
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Rollback only the rows we touched: detach reservations that were
    // themselves created for the default tenant (cannot know originals, so
    // leave them attributed — the FK will SET NULL on tenant delete anyway).
    // No destructive change is made; this is intentionally a no-op for safety.
    await sequelize.query(`
      SELECT 1;
    `);
  },
};
