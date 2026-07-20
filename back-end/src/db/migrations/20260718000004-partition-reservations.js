"use strict";

const { QueryInterface } = require("sequelize");

/**
 * Reservations scaling optimization (Phase 3).
 *
 * Original intent: make `tenantId` NOT NULL and partition `Reservations` by
 * `LINEAR KEY(tenantId)` for 100k-tenant / 1M-customer scale.
 *
 * IMPORTANT — why partitioning is skipped:
 *   MySQL 8.0 cannot partition a table that carries a FULLTEXT index. The
 *   `Reservations` table has `notes_fulltext_idx` on `notes`, so any
 *   `ALTER TABLE ... PARTITION BY` fails with
 *   "The used table type doesn't support FULLTEXT indexes". Switching to a
 *   composite primary key `(id, tenantId)` is also risky: it changes the PK
 *   every FK to `Reservations(id)` depends on and is not required for
 *   correctness (tenant scoping is already enforced in queries/DAOs).
 *
 *   To keep `sequelize db:migrate` runnable we apply only the safe,
 *   compatible part (NOT NULL default) and intentionally skip partitioning.
 *   Revisit only if FULLTEXT search is moved to a dedicated table/index.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Safe, compatible hardening: guarantee tenantId is never NULL.
    // (Already backfilled to 1 for legacy rows; this just enforces the column.)
    await sequelize.query(`
      ALTER TABLE Reservations
        MODIFY COLUMN tenantId INT NOT NULL DEFAULT 1;
    `);

    // Partitioning intentionally NOT applied — see note above.
    // If FULLTEXT is later removed, this can be re-enabled:
    //   ALTER TABLE Reservations
    //     DROP PRIMARY KEY,
    //     ADD PRIMARY KEY (id, tenantId),
    //     PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE Reservations
        MODIFY COLUMN tenantId INT NULL;
    `);
  },
};
