"use strict";

/**
 * Cross-tenant data-leak checker.
 *
 * For a sample of tenants, logs in and fetches /reservations, then verifies that
 * every returned row belongs to that tenant. Because the API response does not
 * expose tenantId, we cross-check the returned reservation IDs against the DB
 * (which does store tenantId) and assert none belong to a different tenant.
 *
 * This is run concurrently to simulate load while checking isolation.
 *
 * Usage: node load-tests/leak-check.js --sample 20 --rounds 3
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const fs = require("fs");
const db = require("../src/db/models");
const cfg = require("./config");
const { loginTenant } = require("./auth");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return fallback;
}

const SAMPLE = parseInt(arg("sample", "20"), 10);
const ROUNDS = parseInt(arg("rounds", "3"), 10);

function extractReservationIds(payload) {
  // The API shape may be { data: [...] } / { reservations: [...] } / [...]
  const arr =
    (Array.isArray(payload) && payload) ||
    payload.collection ||
    payload.data ||
    payload.reservations ||
    payload.rows ||
    (payload.result && (payload.result.rows || payload.result.data)) ||
    [];
  const list = Array.isArray(arr) ? arr : arr.rows || [];
  return list.map((r) => r.id).filter((x) => x != null);
}

async function main() {
  await db.sequelize.authenticate();
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "tenants.manifest.json"), "utf8")
  );
  const sample = manifest.slice(0, Math.min(SAMPLE, manifest.length));

  let checks = 0;
  let leaks = 0;
  const leakDetails = [];

  for (let round = 0; round < ROUNDS; round++) {
    // Fire all tenant fetches concurrently to create contention.
    const sessions = await Promise.all(
      sample.map((t) =>
        loginTenant({
          tenantId: t.tenantId,
          adminEmail: t.adminEmail,
          password: t.password,
          useTenantHeader: true,
        }).catch((e) => ({ error: e.message, tenantId: t.tenantId }))
      )
    );

    await Promise.all(
      sessions.map(async (s) => {
        if (s.error) return;
        const res = await fetch(`${cfg.API}/reservations?page=1&limit=50`, {
          headers: { Cookie: s.cookieHeader, ...s.tenantHeaders },
        });
        if (res.status !== 200) return;
        const body = await res.json();
        const ids = extractReservationIds(body);
        if (ids.length === 0) return;

        // DB truth: which of these reservation IDs do NOT belong to this tenant?
        const rows = await db.reservation.findAll({
          where: { id: { [db.Sequelize.Op.in]: ids } },
          attributes: ["id", "tenantId"],
          raw: true,
        });
        checks++;
        for (const row of rows) {
          if (row.tenantId !== s.tenantId) {
            leaks++;
            leakDetails.push({
              requestingTenant: s.tenantId,
              leakedReservationId: row.id,
              ownerTenant: row.tenantId,
            });
          }
        }
      })
    );
  }

  console.log("\n=== Cross-Tenant Leak Check ===");
  console.log(`Tenants sampled: ${sample.length}`);
  console.log(`Rounds: ${ROUNDS}`);
  console.log(`List responses inspected: ${checks}`);
  console.log(`Cross-tenant rows leaked: ${leaks}`);
  if (leaks > 0) {
    console.log("LEAKS DETECTED:");
    console.log(JSON.stringify(leakDetails.slice(0, 20), null, 2));
  } else {
    console.log("RESULT: PASS — no cross-tenant reservation leakage detected.");
  }

  await db.sequelize.close();
  process.exit(leaks > 0 ? 2 : 0);
}

main().catch(async (err) => {
  console.error("Leak check failed:", err);
  try {
    await db.sequelize.close();
  } catch (_) {}
  process.exit(1);
});
