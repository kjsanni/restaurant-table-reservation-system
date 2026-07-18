"use strict";

const { QueryInterface } = require("sequelize");

/**
 * MySQL Partitioning Migrations — Payments
 *
 * WARNING: These migrations rebuild the table. Run ONLY during a maintenance
 * window on a replica or using pt-online-schema-change / gh-ost.
 *
 * Prerequisites:
 *   1. All tenantId values are non-NULL (backfill already done).
 *   2. Foreign keys referencing Payments do not currently exist, so no
 *      FK recreation is needed around the PK change.
 *
 * Sequence:
 *   a. Make tenantId NOT NULL (default 1 for any stragglers).
 *   b. Drop existing PK.
 *   c. Add composite PK (id, tenantId).
 *   d. Apply LINEAR KEY(tenantId) partitioning with 64 partitions.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      ALTER TABLE payments
        MODIFY COLUMN tenantId INT NOT NULL DEFAULT 1,
        DROP PRIMARY KEY,
        ADD PRIMARY KEY (id, tenantId),
        PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
    `);
  },

  async down() {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE payments
        REMOVE PARTITIONING,
        DROP PRIMARY KEY,
        ADD PRIMARY KEY (id);
    `);
  },
};
