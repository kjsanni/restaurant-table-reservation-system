# Read Replica Integration — Restaurant Reservation System

**Status:** Implemented, backward compatible (disabled by default).
**Scope:** Route read-heavy reporting/analytics SELECT queries to a MySQL read replica, with automatic fallback to the primary.
**Engine:** MySQL 8.0, Sequelize ORM, database `reserve`.
**Primary:** `localhost:3306` (unchanged).

---

## 1. Summary

Read-heavy reporting and analytics queries can be routed to a MySQL read replica so
they do not compete with transactional (write) traffic on the primary. The
implementation uses **Sequelize's native read/write splitting** for transparent
routing, plus a thin helper layer that makes the routing **explicit for reporting
DAO methods** and adds **automatic fallback to the primary** when the replica is
unavailable.

Key properties:

- **Disabled by default.** With no `DB_HOST_REPLICA` set, the app runs exactly as
  before against a single database. No behavioural change, no test changes.
- **Zero DAO rewrites for correctness.** Native splitting sends all `SELECT`s to
  the replica and all writes/transactions to the primary automatically.
- **Explicit, observable routing** for the six target methods, each with
  connection-level fallback to the primary and a warning log.
- **Independent pool sizing** for the replica (read pools are typically larger).

---

## 2. Files Changed

| File | Change |
|---|---|
| `back-end/config/config.js` | Adds a `replica` block per environment (resolved from env vars). `null` when no replica host is set. `test` env forces `replica: null`. |
| `back-end/src/db/models/index.js` | When a replica is configured, creates the Sequelize instance with `replication: { write, read: [...] }` and replica pool sizing. Exposes `db.replicaConfigured`. Single-DB path unchanged. |
| `back-end/src/db/readReplica.js` | **New.** Routing helpers: `readOptions`, `primaryOptions`, `withReplicaFallback`, `isReplicaConfigured`, `isReplicaAvailabilityError`. |
| `back-end/src/DAOs/reservation.dao.js` | `findAllReservations`, `searchReservations`, `getHeatmapV2`, `getReservationStats`, `getPaymentStatusCounts` wrapped in `withReplicaFallback`. |
| `back-end/src/DAOs/payment.dao.js` | `getRevenueStats` wrapped in `withReplicaFallback`. |
| `back-end/.env.production.example` | Documents the new replica env vars. |
| `back-end/src/__tests__/readReplica.test.js` | **New.** Unit tests for routing + fallback logic. |

---

## 3. Design

### 3.1 Why Sequelize native replication (Option A) + explicit helper (Option C)

Three options were considered (from the task):

- **Option A — Sequelize read/write splitting.** Sequelize supports
  `replication: { write: {...}, read: [{...}] }`. It routes every `SELECT` to a
  read pool and everything else (INSERT/UPDATE/DELETE, `transaction()`,
  `SELECT ... FOR UPDATE`) to the write pool. This is the least invasive and is
  correct by construction — writes never accidentally hit a replica.
- **Option B — separate Sequelize instance for the replica.** Rejected as the
  primary mechanism: it duplicates model registration, connection lifecycle, and
  risks a write being issued on the replica instance. Higher maintenance cost.
- **Option C — route specific DAO methods.** Used as a thin layer on top of A to
  make the six reporting methods explicit and to add graceful fallback.

**Chosen design:** A (transparent correctness) **+** C (explicit control &
fallback for reporting). This satisfies "route read-heavy reporting queries to a
replica" precisely while keeping writes safe automatically.

### 3.2 Connection wiring (`src/db/models/index.js`)

```
if (replicaConfigured) {
  new Sequelize(database, null, null, {
    ...baseOptions,
    replication: {
      write: { host: PRIMARY, ... },
      read:  [ { host: REPLICA, ... } ],
    },
    pool: replicaPool,   // read pool sizing
  });
} else {
  new Sequelize(database, username, password, baseOptions); // unchanged single DB
}
```

`db.replicaConfigured` is exported so the helper knows whether to apply explicit
routing.

### 3.3 Routing helper (`src/db/readReplica.js`)

- `readOptions(opts)` → adds `useMaster: false` (force read pool). No-op when no
  replica.
- `primaryOptions(opts)` → adds `useMaster: true` (force write pool).
- `withReplicaFallback(run, { label })`:
  - **No replica:** calls `run({ useMaster: null })` — the DAO omits `useMaster`
    entirely, i.e. identical to the original single-DB query.
  - **Replica configured:** calls `run({ useMaster: false })` (reads replica). On
    a **connection-level** error it logs a warning and retries
    `run({ useMaster: true })` against the primary.
  - **Query-level errors** (bad SQL, constraint violations,
    `SequelizeDatabaseError`, etc.) are **not** retried — they are rethrown so
    real bugs are not masked.

Fallback triggers on these error classes/codes:

- Sequelize: `SequelizeConnectionError`, `SequelizeConnectionRefusedError`,
  `SequelizeHostNotFoundError`, `SequelizeHostNotReachableError`,
  `SequelizeConnectionTimedOutError`, `SequelizeConnectionAcquireTimeoutError`,
  `SequelizeAccessDeniedError`.
- Driver codes (also inspected on `.original`/`.parent`): `ECONNREFUSED`,
  `ETIMEDOUT`, `ENOTFOUND`, `EHOSTUNREACH`, `ECONNRESET`,
  `PROTOCOL_CONNECTION_LOST`.

### 3.4 Read-heavy methods routed to the replica

| DAO method | File | Notes |
|---|---|---|
| `getRevenueStats` | `payment.dao.js` | Revenue aggregation (SUM/AVG/COUNT + by-method). |
| `getReservationStats` | `reservation.dao.js` | List + payment breakdown + status breakdown. |
| `getPaymentStatusCounts` | `reservation.dao.js` | Payment-status aggregation ("payment stats"). |
| `getHeatmapV2` | `reservation.dao.js` | Both `calendar` and `date-hour` modes. |
| `findAllReservations` | `reservation.dao.js` | Paginated/filtered listing (`findAndCountAll`). |
| `searchReservations` | `reservation.dao.js` | Filtered search (`findAndCountAll`). |

> Note: The task named `getPaymentStats`; the equivalent existing aggregation is
> `getPaymentStatusCounts` (reservation payment-status counts) plus payment
> `getRevenueStats`. Both are routed.

Writes, single-row lookups, and transactional paths are intentionally left on the
primary (Sequelize routes them there automatically).

---

## 4. Configuration

### 4.1 Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST_REPLICA` | No | *(empty)* | Replica host. **Empty = single-DB mode (feature off).** |
| `DB_PORT_REPLICA` | No | `DB_PORT` | Replica port. |
| `DB_USERNAME_REPLICA` | No | `DB_USERNAME` | Replica user (falls back to primary user). |
| `DB_PASSWORD_REPLICA` | No | `DB_PASSWORD` | Replica password (falls back to primary). |
| `DB_REPLICA_ENABLED` | No | `true` | Kill switch. Set `false` to disable routing without removing host config. |
| `DB_POOL_MIN_REPLICA` | No | `DB_POOL_MIN` or `2` | Replica read pool min. |
| `DB_POOL_MAX_REPLICA` | No | `DB_POOL_MAX` or `20` | Replica read pool max. |
| `DB_POOL_IDLE_REPLICA` | No | `DB_POOL_IDLE` or `10000` | Replica pool idle ms. |
| `DB_POOL_ACQUIRE_REPLICA` | No | `DB_POOL_ACQUIRE` or `30000` | Replica pool acquire timeout ms. |

The replica **database name** is the same as the primary (`DB_NAME`), as expected
for native MySQL replication.

### 4.2 Enabling the replica

Add to `back-end/.env` (or `.env.production`):

```
DB_HOST_REPLICA=10.0.0.5
DB_PORT_REPLICA=3306
# Credentials optional — omit to reuse primary DB_USERNAME/DB_PASSWORD
DB_USERNAME_REPLICA=reserve_ro
DB_PASSWORD_REPLICA=readonly-password
DB_POOL_MAX_REPLICA=30
```

Restart the backend. On startup you will see:

```
[db] Read replica enabled -> reads: 10.0.0.5:3306, writes: 127.0.0.1:3306
```

### 4.3 Disabling the replica

Either of:

- Set `DB_REPLICA_ENABLED=false` (keeps host config for quick re-enable), **or**
- Remove/blank `DB_HOST_REPLICA`.

Restart the backend. The app reverts to the exact single-DB behaviour.

---

## 5. Fallback Behaviour

```
report query
   │
   ├─ replica configured? ── no ──► run on primary (single DB, unchanged)
   │
   yes
   │
   ├─ run on REPLICA (useMaster:false)
   │        │
   │        ├─ success ──► return
   │        │
   │        └─ connection error (replica down/unreachable)
   │                 │
   │                 ├─ log warning
   │                 └─ retry on PRIMARY (useMaster:true) ──► return
   │
   └─ query-level error ──► rethrow (not masked)
```

This guarantees reporting endpoints keep working (served by the primary) if the
replica is temporarily down, at the cost of extra primary load during the outage.

---

## 6. Operational Notes

- **Replication lag:** Reports may reflect data a few seconds stale. This is
  acceptable for analytics/reporting. Anything requiring read-your-writes
  consistency must not use the replica; those paths (single-row lookups after a
  write, transactions) already stay on the primary.
- **Read-only replica user:** Prefer a dedicated `*_REPLICA` user granted only
  `SELECT`. If the replica user lacks privileges, `SequelizeAccessDeniedError`
  triggers fallback to the primary.
- **Pool sizing:** Size `DB_POOL_MAX_REPLICA` for read concurrency independently
  of the write pool.
- **MySQL setup (out of scope for this change):** Configure primary binlog +
  replica `CHANGE REPLICATION SOURCE TO ...` and ensure the replica is read-only
  (`super_read_only=ON`). This document covers only the application integration.

---

## 7. Testing

- `back-end/src/__tests__/readReplica.test.js` covers: no-op in single-DB mode,
  read-pool routing when configured, connection-failure fallback to primary
  (including wrapped driver codes), and non-fallback rethrow of query errors.
- The full existing suite passes unchanged (`test` env forces `replica: null`, so
  DAO tests that mock `../db/models` are unaffected — `withReplicaFallback` sees
  `replicaConfigured` undefined/false and runs the query exactly as before).

Run:

```
cd back-end && npx jest
```
