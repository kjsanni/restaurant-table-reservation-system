"use strict";

const { QueryInterface } = require("sequelize");

/**
 * MySQL Partitioning Migrations — Reservations
 *
 * WARNING: These migrations rebuild the table. Run ONLY during a maintenance
 * window on a replica or using pt-online-schema-change / gh-ost.
 *
 * Prerequisites:
 *   1. All tenantId values are non-NULL (backfill already done).
 *   2. Foreign keys referencing Reservations(id) are dropped and recreated
 *      around the ALTER because the PK changes from (id) to (id, tenantId).
 *
 * Sequence:
 *   a. Make tenantId NOT NULL (default 1 for any stragglers).
 *   b. Drop existing PK.
 *   c. Add composite PK (id, tenantId).
 *   d. Recreate index on tenantId if needed.
 *   e. Apply LINEAR KEY(tenantId) partitioning with 64 partitions.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE Reservations
        MODIFY COLUMN tenantId INT NOT NULL DEFAULT 1,
        DROP PRIMARY KEY,
        ADD PRIMARY KEY (id, tenantId),
        PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
    `);
  },

  async down() {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE Reservations
        REMOVE PARTITIONING,
        DROP PRIMARY KEY,
      ADD PRIMARY KEY (id);
    `);
  },
};
