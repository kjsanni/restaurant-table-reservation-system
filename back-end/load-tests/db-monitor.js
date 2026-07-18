"use strict";

/**
 * DB connection monitor.
 *
 * Samples MySQL Threads_connected + Threads_running at a fixed interval and
 * prints min/max/avg. Run this in a second terminal WHILE a load test runs to
 * observe connection-pool pressure.
 *
 * Usage: node load-tests/db-monitor.js --interval 500 --seconds 60
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return fallback;
}

const INTERVAL = parseInt(arg("interval", "500"), 10);
const SECONDS = parseInt(arg("seconds", "60"), 10);

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  const [[maxRow]] = await conn.query("SHOW VARIABLES LIKE 'max_connections'");
  const maxConns = parseInt(maxRow.Value, 10);

  const connectedSamples = [];
  const runningSamples = [];
  const end = Date.now() + SECONDS * 1000;

  console.log(`Monitoring MySQL for ${SECONDS}s (max_connections=${maxConns})...`);
  while (Date.now() < end) {
    const [rows] = await conn.query(
      "SHOW STATUS WHERE Variable_name IN ('Threads_connected','Threads_running')"
    );
    const map = Object.fromEntries(rows.map((r) => [r.Variable_name, parseInt(r.Value, 10)]));
    connectedSamples.push(map.Threads_connected || 0);
    runningSamples.push(map.Threads_running || 0);
    await new Promise((r) => setTimeout(r, INTERVAL));
  }

  const stat = (a) => ({
    min: Math.min(...a),
    max: Math.max(...a),
    avg: (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1),
  });
  const c = stat(connectedSamples);
  const r = stat(runningSamples);

  console.log("\n=== MySQL Connection Monitor ===");
  console.log(`Samples:            ${connectedSamples.length}`);
  console.log(`max_connections:    ${maxConns}`);
  console.log(`Threads_connected:  min=${c.min} avg=${c.avg} max=${c.max}`);
  console.log(`Threads_running:    min=${r.min} avg=${r.avg} max=${r.max}`);
  console.log(`Peak pool util:     ${((c.max / maxConns) * 100).toFixed(2)}% of max_connections`);

  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("DB monitor failed:", err);
  process.exit(1);
});
