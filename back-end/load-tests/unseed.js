"use strict";

/**
 * Removes all load-test data (tenants matching TENANT_PREFIX and their rows).
 * NEVER run against production.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const db = require("../src/db/models");
const cfg = require("./config");

if (!db.tenant) {
  const { DataTypes } = require("sequelize");
  db.tenant = require("../src/tenant-platform/models/tenant")(db.sequelize, DataTypes);
}

async function unseed() {
  await db.sequelize.authenticate();
  const prefix = `${cfg.TENANT_PREFIX}-`;
  const tenants = await db.tenant.findAll({
    where: { slug: { [db.Sequelize.Op.like]: `${prefix}%` } },
    attributes: ["id"],
  });
  const ids = tenants.map((t) => t.id);
  if (ids.length === 0) {
    console.log("Nothing to remove.");
    await db.sequelize.close();
    return;
  }
  console.log(`Removing ${ids.length} load-test tenants and their data...`);
  const where = { tenantId: { [db.Sequelize.Op.in]: ids } };
  await db.reservation.destroy({ where });
  await db.table.destroy({ where });
  await db.customer.destroy({ where });
  await db.user.destroy({ where });
  await db.tenant.destroy({ where: { id: { [db.Sequelize.Op.in]: ids } } });
  console.log("Done.");
  await db.sequelize.close();
}

unseed().catch(async (err) => {
  console.error("Unseed failed:", err);
  try {
    await db.sequelize.close();
  } catch (_) {}
  process.exit(1);
});
