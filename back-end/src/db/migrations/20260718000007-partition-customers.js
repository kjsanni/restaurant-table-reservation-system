"use strict";

const { QueryInterface } = require("sequelize");

/**
 * MySQL Partitioning Migrations — Customers
 *
 * WARNING: These migrations rebuild the table. Run ONLY during a maintenance
 * window on a replica or using pt-online-schema-change / gh-ost.
 *
 * Prerequisites:
 *   1. All tenantId values are non-NULL (backfill already done).
 *   2. The composite unique index `(tenantId, email)` already exists from
 *      migration `20260718000002-convert-unique-indexes-to-composite.js`,
 *      so no unique index changes are needed.
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
      ALTER TABLE Customers
        MODIFY COLUMN tenantId INT NOT NULL DEFAULT 1,
        DROP PRIMARY KEY,
        ADD PRIMARY KEY (id, tenantId),
        PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
    `);
  },

  async down() {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE Customers
        REMOVE PARTITIONING,
        DROP PRIMARY KEY,
        ADD PRIMARY KEY (id);
    `);
  },
};
