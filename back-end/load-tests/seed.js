"use strict";

/**
 * Load-test data seeder.
 *
 * Provisions N synthetic tenants, each with:
 *   - 1 admin user (email: admin@<slug>.loadtest / password from config)
 *   - TABLES_PER_TENANT tables
 *   - CUSTOMERS_PER_TENANT customers
 *   - RESERVATIONS_PER_TENANT future reservations
 *
 * All rows are tagged with the tenant's id so multi-tenant isolation can be
 * exercised. Everything is namespaced with the TENANT_PREFIX so `unseed` can
 * remove it cleanly.
 *
 * Usage:
 *   node load-tests/seed.js            # seed
 *   node load-tests/seed.js --clean    # remove all load-test data first, then seed
 *   node load-tests/unseed.js          # remove all load-test data
 *
 * This script talks directly to the DB via the app's Sequelize models. It is
 * safe to run repeatedly (idempotent on tenant slug). NEVER run against prod.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const db = require("../src/db/models");
const cfg = require("./config");

// The tenant model lives under tenant-platform and is only attached to `db` at
// runtime when TENANT_MODE loads it. Register it here so seeding works
// regardless of the server's TENANT_MODE flag.
if (!db.tenant) {
  const { DataTypes } = require("sequelize");
  db.tenant = require("../src/tenant-platform/models/tenant")(db.sequelize, DataTypes);
}

const SALT_ROUNDS = 8; // lower than prod (10) purely to speed up seeding
const CLEAN = process.argv.includes("--clean");

const ADMIN_PERMS = {
  view_reservations: true,
  edit_reservations: true,
  manage_tables: true,
  manage_schedule: true,
  manage_staff: true,
  manage_roles: true,
  manage_groups: true,
  view_audit_logs: true,
  manage_audit_logs: true,
  manage_settings: true,
};

const futureDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + 1 + (offsetDays % 60));
  return d.toISOString().slice(0, 10);
};

const randTime = () => {
  const h = 17 + Math.floor(Math.random() * 5); // 17:00 - 21:00
  const m = Math.random() < 0.5 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}:00`;
};

async function cleanLoadData() {
  const prefix = `${cfg.TENANT_PREFIX}-`;
  const tenants = await db.tenant.findAll({
    where: { slug: { [db.Sequelize.Op.like]: `${prefix}%` } },
    attributes: ["id"],
  });
  const ids = tenants.map((t) => t.id);
  if (ids.length === 0) {
    console.log("No existing load-test tenants to clean.");
    return;
  }
  console.log(`Cleaning ${ids.length} load-test tenants and their data...`);
  const where = { tenantId: { [db.Sequelize.Op.in]: ids } };
  // Order matters for FKs: reservations -> tables/customers -> users -> tenants
  await db.reservation.destroy({ where });
  await db.table.destroy({ where });
  await db.customer.destroy({ where });
  await db.user.destroy({ where });
  await db.tenant.destroy({ where: { id: { [db.Sequelize.Op.in]: ids } } });
  console.log("Clean complete.");
}

async function seed() {
  await db.sequelize.authenticate();
  console.log("DB connected. Seeding load-test data...");
  console.log(
    `Tenants=${cfg.TENANT_COUNT} tables/t=${cfg.TABLES_PER_TENANT} customers/t=${cfg.CUSTOMERS_PER_TENANT} reservations/t=${cfg.RESERVATIONS_PER_TENANT}`
  );

  if (CLEAN) await cleanLoadData();

  const passwordHash = await bcrypt.hash(cfg.ADMIN_PASSWORD, SALT_ROUNDS);
  const manifest = [];

  for (let i = 1; i <= cfg.TENANT_COUNT; i++) {
    const slug = `${cfg.TENANT_PREFIX}-${i}`;
    const name = `LoadTest Tenant ${i}`;

    let tenant = await db.tenant.findOne({ where: { slug } });
    if (!tenant) {
      tenant = await db.tenant.create({
        name,
        slug,
        status: "active",
        plan: "enterprise",
        subscriptionStatus: "active",
        currency: "GHS",
      });
    }
    const tid = tenant.id;

    const adminEmail = `admin@${slug}.loadtest`;
    let admin = await db.user.findOne({ where: { tenantId: tid, email: adminEmail } });
    if (!admin) {
      admin = await db.user.create(
        {
          tenantId: tid,
          username: `admin_${slug}`,
          email: adminEmail,
          password: passwordHash,
          role: "admin",
          permissions: ADMIN_PERMS,
        },
        { validate: false }
      );
    }

    // Tables (bulk, validation disabled to bypass the global unique-name hook)
    const existingTables = await db.table.count({ where: { tenantId: tid } });
    if (existingTables < cfg.TABLES_PER_TENANT) {
      const tables = [];
      for (let t = existingTables + 1; t <= cfg.TABLES_PER_TENANT; t++) {
        tables.push({
          tenantId: tid,
          name: `T${tid}-${t}`,
          capacity: 2 + (t % 6),
          price: 0,
          // DB column floorPlanId is INT (schema drift vs the STRING model
          // default "default"); force null to satisfy the real column type.
          floorPlanId: null,
        });
      }
      if (tables.length) await db.table.bulkCreate(tables, { validate: false });
    }

    // Customers (bulk)
    const existingCustomers = await db.customer.count({ where: { tenantId: tid } });
    let customerIds = [];
    if (existingCustomers < cfg.CUSTOMERS_PER_TENANT) {
      const customers = [];
      for (let c = existingCustomers + 1; c <= cfg.CUSTOMERS_PER_TENANT; c++) {
        customers.push({
          tenantId: tid,
          firstName: `Cust${c}`,
          lastName: `Tenant${tid}`,
          email: `cust${c}@${slug}.loadtest`,
          phone: String(6000000000 + (tid * 100000 + c)).slice(-10),
          tags: [],
        });
      }
      if (customers.length) await db.customer.bulkCreate(customers, { validate: false });
    }
    customerIds = (
      await db.customer.findAll({ where: { tenantId: tid }, attributes: ["id"], raw: true })
    ).map((r) => r.id);

    // Reservations (bulk) — need valid customerId FK
    const existingRes = await db.reservation.count({ where: { tenantId: tid } });
    if (existingRes < cfg.RESERVATIONS_PER_TENANT && customerIds.length) {
      const statuses = ["pending", "seated", "completed", "cancelled", "missed"];
      const reservations = [];
      for (let r = existingRes + 1; r <= cfg.RESERVATIONS_PER_TENANT; r++) {
        reservations.push({
          tenantId: tid,
          customerId: customerIds[r % customerIds.length],
          resDate: futureDate(r),
          resTime: randTime(),
          people: 1 + (r % 8),
          resStatus: statuses[r % statuses.length],
          paymentStatus: "unpaid",
          expectedTotal: 0,
        });
      }
      // chunk to keep single INSERT statements reasonable
      const CHUNK = 500;
      for (let k = 0; k < reservations.length; k += CHUNK) {
        await db.reservation.bulkCreate(reservations.slice(k, k + CHUNK), { validate: false });
      }
    }

    manifest.push({
      tenantId: tid,
      slug,
      adminEmail,
      password: cfg.ADMIN_PASSWORD,
    });

    if (i % 10 === 0 || i === cfg.TENANT_COUNT) {
      console.log(`  seeded ${i}/${cfg.TENANT_COUNT} tenants`);
    }
  }

  const fs = require("fs");
  const manifestPath = path.join(__dirname, "tenants.manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote tenant manifest -> ${manifestPath}`);

  // Also provision a single-tenant baseline admin on tenant 1 (existing default
  // tenant) so `loadtest:baseline` can run against a TENANT_MODE=disabled server.
  const baselineEmail = "loadbaseline@rtrs.com";
  let baseAdmin = await db.user.findOne({ where: { tenantId: 1, email: baselineEmail } });
  if (!baseAdmin) {
    baseAdmin = await db.user.create(
      {
        tenantId: 1,
        username: "loadbaseline",
        email: baselineEmail,
        password: passwordHash,
        role: "admin",
        permissions: ADMIN_PERMS,
      },
      { validate: false }
    );
  } else {
    baseAdmin.password = passwordHash;
    await baseAdmin.save({ validate: false });
  }
  const baselineManifest = [
    { tenantId: 1, slug: "default", adminEmail: baselineEmail, password: cfg.ADMIN_PASSWORD },
  ];
  fs.writeFileSync(
    path.join(__dirname, "baseline.manifest.json"),
    JSON.stringify(baselineManifest, null, 2)
  );
  console.log("Wrote baseline manifest + baseline admin (tenant 1).");

  console.log("Seeding complete.");
  await db.sequelize.close();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await db.sequelize.close();
  } catch (_) {}
  process.exit(1);
});
