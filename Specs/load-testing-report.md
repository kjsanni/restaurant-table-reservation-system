# Load Testing Report — Multi-Tenant Restaurant Reservation System

> Target scale: **100k tenants / 1M customers**
> Stack: Node.js + Express + Sequelize + MySQL 8.0 + Redis + BullMQ
> Author: Performance Engineering
> Status: **Baseline + multi-tenant benchmarks executed on a local single-node rig**

---

## 1. Executive Summary

A full load-testing harness (`back-end/load-tests/`) was built using **autocannon** and executed
against two isolated server instances — a single-tenant **baseline** and a
**multi-tenant** (`TENANT_MODE=enabled`) instance — driving realistic
authenticated traffic across Reservation, Customer, Table, Payment, Report, and
Notification (BullMQ) workloads.

**Headline results (multi-tenant, 50 concurrent connections, single Node instance):**

| Metric | Result | Target | Status |
|---|---|---|---|
| API p95 latency (read mix) | **147 ms** | < 500 ms | ✅ Pass |
| API p95 latency (reports) | **312 ms** | < 500 ms | ✅ Pass |
| API p99 latency (read mix) | 168 ms | — | ✅ |
| Error rate (reads) | **0.00%** | — | ✅ |
| DB pool utilization (peak) | **0.63%** of `max_connections` | < 80% | ✅ |
| Redis cache hit rate | **95.0–95.8%** | high | ✅ |
| Cross-tenant data leaks (tenant mode) | **0** | 0 | ✅ Pass |
| BullMQ notification throughput | **1,461–5,814 jobs/min** | 500/min | ✅ Pass |
| BullMQ drain within 5 min SLA | Yes (5.5 s for 500 jobs) | ≤ 5 min | ✅ Pass |

**Three critical findings** were uncovered that MUST be addressed before the
100k-tenant rollout (detailed in §7):

1. 🔴 **`db.tenant` was never registered on the shared models object** → header/slug
   tenant resolution threw `500 Failed to resolve tenant` for every request in
   `TENANT_MODE`. **Resolved** (the tenant model is now loaded into `db`; see §7.1).
2. 🔴 **Disabling `TENANT_MODE` on a populated multi-tenant DB leaks all tenants'
   data** — the leak checker observed **9,010 cross-tenant rows** exposed. The
   documented "flip `TENANT_MODE` off to roll back" plan is therefore unsafe once
   multi-tenant data exists.
3. 🔴 **Default rate limits (100 req / 15 min / IP) make the API unusable under any
   real load** and even for a single active staff user. Load testing is impossible
   without raising them; production limits need re-tuning.

---

## 2. Test Environment

| Component | Value |
|---|---|
| Host | macOS (ServBay), single machine (app + DB + Redis co-located) |
| Node.js | v26 |
| MySQL | 8.0.46, `max_connections = 9999` |
| Redis | reachable on 127.0.0.1:6379, `maxmemory = 0` (unbounded), `maxmemory-policy = noeviction` |
| App instances | Single Node process per mode (no PM2 cluster) |
| DB pool | `DB_POOL_MIN=10`, `DB_POOL_MAX=50` |
| Load tool | autocannon 7.15.0 |

Server topology used for the runs:

| Port | Mode | Flags |
|---|---|---|
| 8000 | Pre-existing dev server (untouched) | `TENANT_MODE=enabled`, default limits |
| **8100** | **Multi-tenant test target** | `TENANT_MODE=enabled`, `RATE_LIMIT_DISABLED=true`, pool 10/50 |
| **8101** | **Single-tenant baseline target** | `TENANT_MODE=disabled`, `RATE_LIMIT_DISABLED=true`, pool 10/50 |

> Tests were **never** run against production. Dedicated ports and disposable,
> namespaced (`loadtest-*`) tenant data were used throughout.

### Seeded data volume

Per synthetic tenant: **20 tables, 200 customers, 500 reservations**, 1 admin user.
Tenant 1 (baseline) was seeded with the same volume for an apples-to-apples
comparison. The harness supports 100+ tenants; runs here used 5 active tenant
sessions (see §8 for why the count was capped locally).

---

## 3. Load Test Design

Scenarios map directly to the production deployment checklist §7:

| Checklist requirement | How it is exercised |
|---|---|
| 1000 concurrent authenticated users / tenant | `--connections` sweep (25→200) with authenticated cookie+CSRF sessions |
| 100 tenants active simultaneously | Traffic round-robins across N tenant sessions, each sending `X-Tenant-Id` |
| Peak reservation creation 100 req/min | `reservation_crud` scenario POSTs to `/reservations` (CSRF-protected) |
| Notification dispatch 500 emails/min | `queue-bench.js` enqueues 500 BullMQ jobs and measures drain time |

### Scenario matrix (`load-tests/scenarios.js`)

| Scenario | Endpoints (weighted) |
|---|---|
| `mixed_read` | reservations list/stats, tables, customer search, heatmap-v2, `/auth/me` |
| `reservation_crud` | reservations list/search/stats + **POST /reservations** |
| `customer_mgmt` | `/customers/search` (multiple queries) |
| `table_mgmt` | `/tables`, `/tables/staff` |
| `payments` | `/reservations/payment-summary`, `/reservations/revenue/time-series` |
| `reports` | reservations/time-series/customers/utilization/turn-time/no-shows |
| `tenant_probe` | per-tenant reservation list (used by the leak checker) |

Every request carries the tenant's session cookie (JWT) and, in tenant mode, its
`X-Tenant-Id` header, so **tenant-resolution middleware is on the hot path** for
every measured request.

---

## 4. Baseline vs Multi-Tenant Results

Configuration: 50 connections, 10 s per scenario, single Node instance.

### 4.1 Baseline (single-tenant, `TENANT_MODE=disabled`)

| Scenario | Throughput (rps) | p50 (ms) | p95 (ms) | p99 (ms) | Error % |
|---|---|---|---|---|---|
| mixed_read | 69.9 | 663 | 1536 | 3168 | 0.00 |
| reservation_crud | 67.5 | 679 | 1642 | 3102 | 0.00 |
| customer_mgmt | 1324.8 | 34 | 45 | 48 | 0.00 |
| table_mgmt | 341.5 | 142 | 207 | 225 | 0.00 |
| payments | 1503.9 | 33 | 39 | 44 | 0.00 |
| reports | 20.0 | 2043 | 2248 | 3059 | 0.00 |

### 4.2 Multi-Tenant (`TENANT_MODE=enabled`, 5 tenants)

| Scenario | Throughput (rps) | p50 (ms) | p95 (ms) | p99 (ms) | Error % |
|---|---|---|---|---|---|
| mixed_read | 642.8 | 81 | **147** | 168 | 0.00 |
| reservation_crud | 598.5 | 92 | 151 | 167 | 16.71¹ |
| customer_mgmt | 1335.1 | 36 | 48 | 58 | 0.00 |
| table_mgmt | 1027.0 | 52 | 73 | 85 | 0.00 |
| payments | 1593.3 | 31 | 39 | 43 | 0.00 |
| reports | 268.4 | 156 | **312** | 337 | 0.00 |

¹ The 16.7% non-2xx on `reservation_crud` are **expected HTTP 400 business
validations** (`"No schedule configured for monday"`) — the synthetic tenants have
no operating-hours schedule seeded. The full validation + tenant-resolution + DAO
path still executes, so the measured write-path latency (p50 92 ms, p95 151 ms) is
valid. No 5xx errors occurred.

### 4.3 Interpretation — why multi-tenant is *faster* than baseline

This is the most important analytical result. Multi-tenant `mixed_read` p50 is
**81 ms vs 663 ms** baseline, and `reports` is **156 ms vs 2043 ms**.

The cause is **query scoping**, not middleware:

- In **tenant mode**, reads are filtered by `tenantId`, which hits the
  `reservations_tenant_id` / composite indexes. `EXPLAIN` confirms
  `type=ref, key=reservations_tenant_id`, scanning ~100 rows.
- In **single-tenant mode against a DB that contains many tenants' rows**, the
  DAOs do **not** add a `tenantId` filter, so aggregate/report/list queries scan
  the entire table (all tenants' ~2,600+ reservations). That larger scan dominates
  latency.

**Conclusion:** tenant-resolution middleware overhead is negligible; the composite
`tenantId` indexes are effective and are the primary driver of good multi-tenant
read latency. The middleware adds one cached tenant lookup (95%+ Redis hit rate),
which does not measurably affect p95.

---

## 5. Capacity Curve (single Node instance, `mixed_read`, tenant mode)

| Connections | Throughput (rps) | p50 (ms) | p95 (ms) | p99 (ms) | p95 < 500ms? |
|---|---|---|---|---|---|
| 25 | 689.5 | 28 | 72 | 80 | ✅ |
| 50 | 651.9 | 79 | 147 | 163 | ✅ |
| 100 | 474.7 | 207 | 358 | 550 | ✅ |
| 200 | 469.6 | 414 | **569** | 1291 | ❌ |

- The **knee is ~100 concurrent connections** per Node instance while keeping p95
  under 500 ms.
- Throughput plateaus (~470–690 rps) and latency climbs while **DB pool stays at
  0.63% utilization** → the bottleneck is the **single-threaded Node event loop /
  CPU**, not MySQL or the connection pool.
- Implication: to serve **1000 concurrent users/tenant × 100 tenants**, scale
  **horizontally** (PM2 cluster / multiple pods). Roughly one Node instance per
  ~100 concurrent connections at target latency; size the fleet from real
  concurrency, not raw user counts.

---

## 6. Resource Observations

### 6.1 MySQL connection pool

| | Baseline run | Tenant run |
|---|---|---|
| `Threads_connected` (min/avg/max) | 23 / 60 / 63 | 23 / 60 / 63 |
| `Threads_running` (max) | 46 | 23 |
| Peak pool util vs `max_connections` | **0.63%** | **0.63%** |

Pool was never a constraint at this scale. **However**, `max_connections=9999` on
this dev box is atypical. In production: `DB_POOL_MAX (50) × PM2 instances` must
stay under MySQL `max_connections`. At 100 instances × 50 = 5,000 connections —
size MySQL accordingly or lower per-instance `DB_POOL_MAX`.

### 6.2 Redis cache

- **Hit rate: 95.0–95.8%** (`keyspace_hits=216,369`, `misses=11,578`).
- Tenant cache populated correctly: 5 `tenant:id:*` keys, 300 s TTL.
- Memory: ~2.4 MB used.
- ⚠️ **`maxmemory=0` (unbounded), `maxmemory-policy=noeviction`** → at 100k tenants
  the tenant cache + BullMQ + rate-limit keys will grow without eviction and Redis
  will OOM-crash rather than evict. Must set `maxmemory` + `allkeys-lru`.

### 6.3 Index verification (`EXPLAIN` + `information_schema`)

Confirmed composite/tenant indexes present:

| Table | Indexes |
|---|---|
| Reservations | `reservations_tenant_id (tenantId)`, PK, `customerId`, `notes_fulltext_idx` |
| Customers | `customers_tenant_id`, `customers_tenant_id_email (tenantId,email)` |
| Tables | `tables_tenant_id`, `tables_tenant_id_name (tenantId,name)` |
| Users | `users_tenant_id`, `(tenantId,email)`, `(tenantId,username)` |

Missing (recommended by checklist): a covering index
**`(tenantId, resDate, resStatus)` on Reservations** for the heatmap/report hot
paths.

---

## 7. Bottleneck & Risk Analysis

### 🔴 Critical

1. **`db.tenant` not registered → tenant resolution 500s (RESOLVED)**
   `resolveTenant` and all `tenant-platform` services call `db.tenant.*`, but the
   tenant model (originally only in `src/tenant-platform/models/`) was never
   attached to the shared `db` object built by `src/db/models/index.js`. With
   `TENANT_MODE=enabled` and header/slug resolution, **every request returned
   `500 Failed to resolve tenant`**. This is now resolved: the tenant model is
   registered on `db` (via `src/db/models/tenant.js`, picked up by the model
   directory scanner; a guarded `TENANT_MODE`-gated fallback also exists in
   `src/db/models/index.js`). Verified: login + scoped reads return 200 with the
   correct tenant's rows, and `db.tenant` resolves to a single model instance
   (no double-registration).

2. **Rollback via `TENANT_MODE` off = full cross-tenant data exposure**
   The leak checker run against a single-tenant server holding multi-tenant data
   found **9,010 cross-tenant reservation rows** returned to the wrong tenant.
   Isolation depends entirely on `TENANT_MODE` being on (DAOs only add the
   `tenantId` filter when `req.tenant`/`req.user.tenantId` is set). The checklist's
   "flip `TENANT_MODE` off to roll back instantly" is **unsafe** once tenants
   share the DB. In tenant mode, isolation is **correct (0 leaks)**.

3. **Rate limits throttle legitimate load**
   `generalLimiter` = 100 req / 15 min / IP. Under load this produced ~99.9%
   `429`s; it also throttles a single active staff member behind NAT. Limits must
   be raised and ideally keyed per authenticated user/tenant, not per IP.
   (A `RATE_LIMIT_*` / `RATE_LIMIT_DISABLED` env override was added so limits are
   tunable without code changes; production defaults are unchanged.)

### 🟠 Important

4. **Single Node instance is CPU-bound at ~100 connections** — horizontal scaling
   is mandatory for the stated concurrency. DB/pool have ample headroom.
5. **Redis has no memory cap / eviction policy** — OOM risk at scale.
6. **Report/aggregation queries are the heaviest** (p95 312 ms in tenant mode even
   at low volume) and will degrade as per-tenant reservation counts grow toward 1M
   total — route to a read replica and add the covering index.

### 🟡 Minor

7. `POST /reservations` requires a seeded schedule; load fixtures should seed
   operating hours to exercise the true write success path.
8. Schema drift: `Tables.floorPlanId` is `INT` in the DB but `STRING` (default
   `"default"`) in the Sequelize model — inserts with the model default fail.

---

## 8. Known Limitations of This Run

- **5 active tenant sessions** (not 100) were used locally because `authLimiter`
  (10 logins / 15 min / IP) blocks bulk session creation from one IP. The harness
  caches JWT sessions to disk and supports 100+ tenants; at true scale, either
  raise `RATE_LIMIT_AUTH_MAX`, distribute login across source IPs, or pre-mint
  tokens. Traffic *is* spread across the seeded tenants, so tenant resolution and
  isolation are genuinely exercised.
- App, MySQL, and Redis are **co-located on one machine**, so absolute numbers are
  conservative vs a distributed production topology; the **relative** comparisons
  and bottleneck locations are valid.
- No PM2 cluster was used, so the results represent **per-instance** capacity.

---

## 9. Recommendations for Scaling to 100k Tenants / 1M Customers

**Immediate (blockers):**
1. ✅ Tenant model is registered on `db` (keep it). Add a regression test that
   boots the app with `TENANT_MODE=enabled` and asserts a header-resolved request
   returns 200 (guards against the model being un-registered again).
2. Redefine the rollback plan — **do not** disable `TENANT_MODE` on shared data.
   Use per-tenant suspension, not a global flag flip, for rollback.
3. Re-tune rate limits: raise `generalLimiter` substantially and key it on
   `userId`/`tenantId`. Ship the new `RATE_LIMIT_*` env knobs to production config.

**Short term:**
4. Deploy **PM2 cluster** (`exec_mode: cluster`, `instances: max`); size the fleet
   for ~100 concurrent connections/instance at p95 < 500 ms. Confirm
   `DB_POOL_MAX × instances < MySQL max_connections`.
5. Set Redis `maxmemory` + `maxmemory-policy allkeys-lru`; add memory alerting.
6. Add covering index `(tenantId, resDate, resStatus)` on `Reservations`.
7. Route report/analytics DAOs to a **read replica** (config scaffolding already
   exists via `DB_HOST_REPLICA`).

**Medium term:**
8. Evaluate `tenantId`-hash partitioning on `Reservations`, `Payments`,
   `Customers` (checklist §1) once per-table row counts approach millions.
9. Move BullMQ workers to dedicated processes; keep worker `concurrency` tuned
   (measured 1,461 jobs/min at concurrency 5 / 200 ms send — comfortably above the
   500/min target; 5,814/min at concurrency 20).
10. Add continuous latency/error/pool/queue-depth dashboards and the alerts in
    checklist §6.

---

## 10. How to Run the Load Tests

All scripts live in `back-end/load-tests/`. Run from `back-end/`.

```bash
# 1. Install tooling (already added to devDependencies)
npm install

# 2. Seed synthetic tenants + data (namespaced loadtest-*, safe to re-run)
LOAD_TENANTS=100 npm run loadtest:seed          # 100 tenants
#   or a smaller set:
LOAD_TENANTS=5 LOAD_CUSTOMERS=50 LOAD_RESERVATIONS=100 npm run loadtest:seed

# 3. Start a dedicated test server (NEVER production), e.g.:
PORT=8100 TENANT_MODE=enabled RATE_LIMIT_DISABLED=true \
  DB_POOL_MIN=10 DB_POOL_MAX=50 node ./src/app.js

# 4. Run scenarios
LOAD_BASE_URL=http://127.0.0.1:8100 npm run test:load            # all scenarios
LOAD_BASE_URL=http://127.0.0.1:8100 npm run loadtest:tenant      # multi-tenant suite
npm run loadtest:baseline                                        # single-tenant suite (port/flags per §2)

# Target a single scenario / tune load:
LOAD_BASE_URL=http://127.0.0.1:8100 \
  node load-tests/run.js --scenario mixed_read --connections 100 --duration 20 --sessions 100

# 5. Tenant isolation & queue benchmarks
LOAD_BASE_URL=http://127.0.0.1:8100 npm run loadtest:leak        # cross-tenant leak check
npm run loadtest:queue                                           # BullMQ 500-job dispatch

# 6. Observe DB pool during a run (second terminal)
node load-tests/db-monitor.js --interval 400 --seconds 90

# 7. Clean up
npm run loadtest:unseed
```

Environment overrides (see `load-tests/config.js`): `LOAD_BASE_URL`,
`LOAD_TENANTS`, `LOAD_CUSTOMERS`, `LOAD_RESERVATIONS`, `LOAD_TABLES`,
`LOAD_CONNECTIONS`, `LOAD_DURATION`, `LOAD_ADMIN_PASSWORD`.
JSON result artifacts are written to `load-tests/results/`.

### Files added

| File | Purpose |
|---|---|
| `load-tests/config.js` | Central, env-overridable config |
| `load-tests/seed.js` / `unseed.js` | Provision / remove synthetic tenants + data |
| `load-tests/auth.js` | Tenant login + cookie/CSRF capture with disk session cache |
| `load-tests/scenarios.js` | Weighted endpoint mixes per workload |
| `load-tests/run.js` | autocannon runner (rotates tenant sessions, records latency/Redis) |
| `load-tests/leak-check.js` | Cross-tenant data-leak verifier (DB-truth cross-check) |
| `load-tests/queue-bench.js` | BullMQ notification-dispatch throughput benchmark |
| `load-tests/db-monitor.js` | MySQL `Threads_connected/running` sampler |

### Source changes made during this engagement

| File | Change | Risk |
|---|---|---|
| `src/db/models/index.js` | `TENANT_MODE`-gated **fallback** to register `db.tenant` if the model is not picked up by the directory scanner (no-op when already present) | Low — guarded |
| `src/middleware/rateLimit.js` | `RATE_LIMIT_*` / `RATE_LIMIT_DISABLED` env overrides; production defaults unchanged | Low — additive |
| `back-end/package.json` | `loadtest:*` / `test:load` scripts; autocannon devDependency | None |

All **121 existing unit tests across 20 suites still pass** after these changes.
