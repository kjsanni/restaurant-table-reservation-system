"use strict";

/**
 * Load-test runner (autocannon-based).
 *
 * Flow:
 *   1. Load the tenant manifest produced by seed.js.
 *   2. Authenticate a pool of tenant admins (concurrent logins).
 *   3. For each requested scenario, run autocannon with a rotating pool of
 *      authenticated sessions (each request picks a random session so traffic
 *      is spread across tenants — this is what exercises tenant resolution).
 *   4. Collect latency percentiles, throughput, error/non-2xx counts.
 *   5. Snapshot Redis (cache hit rate / keyspace) + a rough DB pool view.
 *   6. Print a JSON + human summary; optionally write to results/.
 *
 * Usage:
 *   node load-tests/run.js --scenario mixed_read --connections 50 --duration 20 --sessions 100
 *   node load-tests/run.js --scenario all --label baseline
 *
 * Env: LOAD_BASE_URL, LOAD_TENANT_MODE (label only), etc. (see config.js)
 */

const fs = require("fs");
const path = require("path");
const autocannon = require("autocannon");
const cfg = require("./config");
const scenarios = require("./scenarios");
const { loginTenant } = require("./auth");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) {
    return process.argv[i + 1];
  }
  return fallback;
}

const SCENARIO = arg("scenario", "mixed_read");
const CONNECTIONS = parseInt(arg("connections", cfg.CONNECTIONS), 10);
const DURATION = parseInt(arg("duration", cfg.DURATION), 10);
const SESSIONS = parseInt(arg("sessions", "50"), 10);
const LABEL = arg("label", cfg.TENANT_MODE);
const USE_TENANT_HEADER = arg("tenantHeader", "true") !== "false";
const WRITE_RESULTS = arg("out", "true") !== "false";

function loadManifest() {
  const custom = arg("manifest", null);
  const p = custom
    ? path.resolve(custom)
    : path.join(__dirname, "tenants.manifest.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      `Manifest not found at ${p}. Run \`npm run loadtest:seed\` first.`
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function buildSessions(manifest, count) {
  const pool = manifest.slice(0, Math.min(count, manifest.length));
  console.log(
    `Authenticating ${pool.length} tenant session(s) (tenantHeader=${USE_TENANT_HEADER})...`
  );
  const sessions = [];
  const failures = [];
  // Login with limited concurrency to avoid hammering authLimiter windows.
  const CONC = 20;
  for (let i = 0; i < pool.length; i += CONC) {
    const batch = pool.slice(i, i + CONC);
    const results = await Promise.allSettled(
      batch.map((t) =>
        loginTenant({
          tenantId: t.tenantId,
          adminEmail: t.adminEmail,
          password: t.password,
          useTenantHeader: USE_TENANT_HEADER,
        })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") sessions.push(r.value);
      else failures.push(r.reason.message);
    }
  }
  if (sessions.length === 0) {
    throw new Error(
      `No sessions authenticated. First error: ${failures[0] || "unknown"}`
    );
  }
  if (failures.length) {
    console.warn(`  ${failures.length} login(s) failed (continuing). e.g. ${failures[0]}`);
  }
  console.log(`  ${sessions.length} session(s) ready.`);
  return sessions;
}

/**
 * Expand a scenario's weighted requests into a flat autocannon `requests` list.
 *
 * autocannon v7's `setupRequest` hook does not reliably override method/path, so
 * we bake everything (path, method, body, per-session auth headers, tenant
 * header, CSRF) directly into each request entry. autocannon cycles through the
 * array across connections, so interleaving templates with sessions spreads
 * traffic across tenants and exercises tenant resolution + isolation.
 */
function buildRequests(scenario, sessions) {
  const weighted = [];
  for (const r of scenario.requests) {
    const n = Math.max(1, r.weight || 1);
    for (let i = 0; i < n; i++) weighted.push(r);
  }

  const requests = [];
  // Cross-product templates x sessions so every tenant issues every request
  // type; keep it bounded to avoid an enormous array.
  const maxEntries = 400;
  let idx = 0;
  while (requests.length < maxEntries) {
    const tmpl = weighted[idx % weighted.length];
    const session = sessions[idx % sessions.length];
    idx++;

    const headers = {
      Cookie: session.cookieHeader,
      ...session.tenantHeaders,
    };
    const entry = {
      method: tmpl.method,
      path: "/api/v1" + tmpl.path,
      headers,
    };
    if (tmpl.method !== "GET") {
      headers["Content-Type"] = "application/json";
      if (tmpl.csrf) headers["x-xsrf-token"] = session.csrfToken;
      const bodyObj = typeof tmpl.body === "function" ? tmpl.body() : tmpl.body || {};
      entry.body = JSON.stringify(bodyObj);
    }
    requests.push(entry);

    // Stop once we've covered at least one full pass of both dimensions.
    if (idx >= weighted.length * sessions.length && requests.length >= weighted.length) break;
  }
  return requests;
}

function runScenario(name, sessions) {
  const scenario = scenarios[name];
  if (!scenario) throw new Error(`Unknown scenario: ${name}`);

  const requests = buildRequests(scenario, sessions);

  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: cfg.BASE_URL,
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: cfg.PIPELINING,
        requests,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    autocannon.track(instance, { renderProgressBar: true, renderResultsTable: false });
  });
}

function summarize(name, result) {
  const total = result.requests.total;
  const non2xx = result.non2xx || 0;
  const errors = result.errors || 0;
  const timeouts = result.timeouts || 0;
  return {
    scenario: name,
    description: scenarios[name].description,
    duration_s: result.duration,
    connections: CONNECTIONS,
    throughput_rps: result.requests.average,
    total_requests: total,
    latency_ms: {
      p50: result.latency.p50,
      p90: result.latency.p90,
      p95: result.latency.p97_5, // autocannon exposes p97_5 as its high percentile
      p99: result.latency.p99,
      max: result.latency.max,
      avg: result.latency.average,
    },
    non2xx,
    errors,
    timeouts,
    error_rate_pct: total > 0 ? (((non2xx + errors + timeouts) / total) * 100).toFixed(2) : "0.00",
  };
}

async function redisSnapshot() {
  try {
    const { createClient } = require("redis");
    const client = createClient({
      socket: { host: process.env.REDIS_HOST || "127.0.0.1", port: parseInt(process.env.REDIS_PORT || "6379", 10) },
    });
    await client.connect();
    const info = await client.info("stats");
    const mem = await client.info("memory");
    const keyspace = await client.info("keyspace");
    const getNum = (blob, key) => {
      const m = blob.match(new RegExp(`${key}:(\\d+)`));
      return m ? parseInt(m[1], 10) : 0;
    };
    const hits = getNum(info, "keyspace_hits");
    const misses = getNum(info, "keyspace_misses");
    const usedMem = (mem.match(/used_memory_human:(\S+)/) || [])[1] || "n/a";
    const tenantKeys = await client.keys("tenant:*");
    const rlKeys = await client.keys("rl:*");
    await client.quit();
    return {
      keyspace_hits: hits,
      keyspace_misses: misses,
      hit_rate_pct: hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : "n/a",
      used_memory: usedMem,
      tenant_cache_keys: tenantKeys.length,
      rate_limit_keys: rlKeys.length,
      keyspace_summary: keyspace.split("\n").filter((l) => l.startsWith("db")).join(" | "),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  const manifest = loadManifest();
  const sessions = await buildSessions(manifest, SESSIONS);

  const names = SCENARIO === "all" ? Object.keys(scenarios).filter((n) => n !== "tenant_probe") : [SCENARIO];

  const redisBefore = await redisSnapshot();
  const summaries = [];

  for (const name of names) {
    console.log(`\n=== Scenario: ${name} (${LABEL}) ===`);
    const result = await runScenario(name, sessions);
    const s = summarize(name, result);
    summaries.push(s);
    console.log(
      `  rps=${s.throughput_rps} p50=${s.latency_ms.p50}ms p95=${s.latency_ms.p95}ms p99=${s.latency_ms.p99}ms errRate=${s.error_rate_pct}% (non2xx=${s.non2xx} err=${s.errors} to=${s.timeouts})`
    );
  }

  const redisAfter = await redisSnapshot();

  const report = {
    label: LABEL,
    tenant_mode: cfg.TENANT_MODE,
    base_url: cfg.BASE_URL,
    tenant_header: USE_TENANT_HEADER,
    sessions: sessions.length,
    connections: CONNECTIONS,
    duration_s: DURATION,
    timestamp: new Date().toISOString(),
    scenarios: summaries,
    redis_before: redisBefore,
    redis_after: redisAfter,
  };

  if (WRITE_RESULTS) {
    const dir = path.join(__dirname, "results");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${LABEL}-${SCENARIO}-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    console.log(`\nResults written -> ${file}`);
  }

  console.log("\n" + JSON.stringify(report, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Runner failed:", err);
  process.exit(1);
});
