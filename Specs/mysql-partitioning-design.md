# MySQL Partitioning Design — Multi-Tenant Restaurant Reservation System

**Status:** Design only — migrations below are NOT executed.
**Scope:** `Reservations`, `Payments`, `Customers` (all already carry `tenantId`).
**Target scale:** 100k tenants, 1M customers, 10M+ reservations.
**Engine:** InnoDB, MySQL 8.0, database `reserve`.

---

## 1. Current Schema Snapshot (verified from live DB)

| Table | PK | tenantId | Notable constraints / indexes |
|---|---|---|---|
| `Reservations` | `id` auto-inc | `int DEFAULT NULL` | `KEY(customerId)`, `KEY(tenantId)`, `FULLTEXT(notes)`, FK→`Customers`, FK→`tenants` ON DELETE SET NULL |
| `Payments` | `id` auto-inc | `int DEFAULT NULL` | `KEY(reservationId)`, `KEY(tenantId)`, FK→`Reservations`, FK→`tenants` ON DELETE SET NULL |
| `Customers` | `id` auto-inc | `int DEFAULT NULL` | **`UNIQUE(tenantId, email)`**, `KEY(tenantId)`, FK→`tenants` ON DELETE SET NULL |

Current row counts are dev/seed-scale (Reservations≈3, Customers≈4, Payments≈2), so this is a forward-looking design rather than a capacity-driven one.

---

## 2. Partitioning Method: Why `KEY` (not `HASH` or `RANGE`)

### 2.1 Candidate comparison

| Method | Partition key requirement | Pros | Cons for this system |
|---|---|---|---|
| **RANGE** | explicit boundaries on a continuous value | Great for time-based purge | `tenantId` has no natural ordered boundary at 100k tenants; impossible to maintain 100k ranges; no tenant-level pruning symmetry |
| **HASH(expr)** | integer expression | Even distribution, easy to add/coalesce | Distribution depends entirely on the expression; MySQL `HASH` uses `MOD(N, num)`, vulnerable to skew if the raw `tenantId` distribution is uneven (e.g. sequential tenant IDs handed out in bursts) |
| **KEY(col)** ✅ | one or more columns, MySQL hashes internally (2^N) | Native handling of `NULL` (`NULL` → partition 0), even distribution across many columns, **every unique/primary key must contain the partition key — `KEY` lets you declare the partition key and MySQL validates/requires it in PK/UNIQUE**, integrates cleanly with `LINEAR KEY` for cheap re-partitioning | Key columns limited to integer/string types (tenantId int is fine); less human-readable than RANGE |

### 2.2 Decision

**Use `KEY(tenantId)` (optionally `LINEAR KEY`) on all three tables.**

Rationale:
1. **`NULL` tenantId safety.** `tenantId` is nullable. `KEY` partitioning maps `NULL` deterministically to partition 0, whereas `HASH` returns `NULL`/error unless you wrap with `COALESCE(tenantId,0)`. `KEY` removes that footgun. (Note: a future migration to make `tenantId NOT NULL` is recommended — see §7.)
2. **Composite unique index compatibility.** A partitioned table requires **every unique key (including the PK) to contain the partition key**. `Customers` has `UNIQUE(tenantId, email)` — `tenantId` is already in it, so `KEY(tenantId)` is compatible. The `Reservations`/`Payments` PK is `(id)` only, so we must **promote `tenantId` into the PK** (`PRIMARY KEY(id, tenantId)`). `KEY` partitioning enforces this cleanly and avoids silent uniqueness violations.
3. **Even tenant distribution.** `KEY` uses MySQL's internal hash across all declared columns; far more robust against skewed `tenantId` value ranges than a naive `HASH(tenantId)`.
4. **Re-partitioning cost.** `LINEAR KEY` uses a powers-of-2 tree, so going 64→256 touches only ~50% of partitions per `REORGANIZE` and supports cheap `ADD`/`COALESCE`. We recommend `LINEAR KEY` for the path to 256+ partitions (§5).

---

## 3. Partition Count & Growth Math

| Tenants | Reservations (total) | Partitions | Rows/partition (res) | Rows/partition (cust, 1M) | Index B-tree depth |
|---|---|---|---|---|---|
| 100k (now) | 10M | **64** | ~156k | ~15.6k | 3 |
| 100k | 50M | 128 | ~390k | — | 3 |
| 100k | 100M+ | **256** | ~390k | — | 3 |

**Why 64 to start, 256 at scale:**
- InnoDB secondary-index B-trees stay ≤3 levels up to several hundred thousand rows per partition, keeping point lookups at ~3–4 random I/O.
- 64 partitions × 3 tables = 192 partition objects — trivial overhead for the optimizer and `information_schema`.
- Even at 256 partitions the per-partition row count stays within the sweet spot; we do **not** recommend exceeding 256 for a single table (partition-management and `open_files_limit`/optimizer overhead grow, and many-partition pruning still scans all when `tenantId` is absent from the predicate).

**Tenant→partition mapping:** `partition = FLOOR(CRC32-independent internal hash of tenantId) % N`. This is **not** tenant-contiguous, so a single hot tenant lands in one partition while its neighbors are spread — exactly what we want. There is no "list of tenants per partition" to maintain.

---

## 4. Migration SQL (DESIGN ONLY — do not run)

> Prerequisites for every migration:
> 1. `tenantId` is `DEFAULT NULL` — fine for `KEY`, but a `PRIMARY KEY(id, tenantId)` on a nullable column is **allowed** (InnoDB permits nullable PK columns; only the *partitioning* key's NULL handling matters). If you later enforce `NOT NULL`, no schema change to partitions is needed.
> 2. These are **`ALTER TABLE ... PARTITION BY KEY`** rewrites — they rebuild the table. Run on a replica / during a maintenance window. For zero-downtime use `gh-ost` or `pt-online-schema-change` (see §8).
> 3. `FULLTEXT` and `FOREIGN KEY` constraints are dropped/recreated around the rewrite as noted.

### 4.1 Reservations

```sql
-- ============ MIGRATION: Reservations by KEY(tenantId), 64 partitions ============
USE reserve;

-- 1. Drop FKs that reference this table from children (reservation_staff, Tables.reservationId)
--    and the table's own FKs that MySQL will keep; KEY partitioning keeps them,
--    but the PK change below requires dropping/re-adding the self-referencing FK.
--    (Inspect: SELECT * FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME='Reservations';)

-- 2. Rewrite with composite PK (id, tenantId) so the partition key is in every unique key.
ALTER TABLE Reservations
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id, tenantId),
  DROP INDEX reservations_tenant_id,
  ADD INDEX reservations_tenant_id (tenantId),
  PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;

-- 3. Recreate the FULLTEXT index (FULLTEXT is preserved by PARTITION BY in 8.0.13+,
--    but explicitly verify; recreate if needed):
-- ALTER TABLE Reservations ADD FULLTEXT notes_fulltext_idx (notes);

-- 4. Child FK recreation (example, adjust to actual discovered FKs):
-- ALTER TABLE reservation_staff ADD CONSTRAINT fk_rs_res
--   FOREIGN KEY (reservationId) REFERENCES Reservations(id) ON DELETE CASCADE ON UPDATE CASCADE;
```

**Rollback — Reservations:**
```sql
USE reserve;
ALTER TABLE Reservations
  REMOVE PARTITIONING,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id),
  DROP INDEX reservations_tenant_id,
  ADD INDEX reservations_tenant_id (tenantId);
```

### 4.2 Payments

```sql
-- ============ MIGRATION: Payments by KEY(tenantId), 64 partitions ============
USE reserve;

ALTER TABLE Payments
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id, tenantId),
  DROP INDEX payments_tenant_id,
  ADD INDEX payments_tenant_id (tenantId),
  PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
```

**Rollback — Payments:**
```sql
USE reserve;
ALTER TABLE Payments
  REMOVE PARTITIONING,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id),
  DROP INDEX payments_tenant_id,
  ADD INDEX payments_tenant_id (tenantId);
```

### 4.3 Customers

```sql
-- ============ MIGRATION: Customers by KEY(tenantId), 64 partitions ============
USE reserve;
-- UNIQUE(tenantId, email) already contains the partition key → compatible, no change needed.

ALTER TABLE Customers
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id, tenantId),
  PARTITION BY LINEAR KEY(tenantId) PARTITIONS 64;
-- NOTE: UNIQUE KEY customers_tenant_id_email (tenantId, email) is preserved automatically
--       because it already includes tenantId.
```

**Rollback — Customers:**
```sql
USE reserve;
ALTER TABLE Customers
  REMOVE PARTITIONING,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (id);
```

### 4.4 Scale-out to 256 partitions (run when row pressure warrants)

```sql
-- Each statement adds partitions without full rewrite in 8.0 for KEY/LINEAR KEY.
ALTER TABLE Reservations COALESCE PARTITION 0, ADD PARTITION PARTITIONS 192; -- 64 -> 256
ALTER TABLE Payments     COALESCE PARTITION 0, ADD PARTITION PARTITIONS 192;
ALTER TABLE Customers    COALESCE PARTITION 0, ADD PARTITION PARTITIONS 192;
-- With LINEAR KEY, ADD PARTITION re-distributes only the needed power-of-2 splits,
-- keeping the operation online-friendly (still a metadata + row-move op; use gh-ost for 0-downtime).
```

---

## 5. Performance Implications

### 5.1 Partition pruning (the win)
Every tenant-scoped query must include `tenantId` in the `WHERE` clause. The optimizer then prunes to exactly **one** partition.

| Query pattern | Prunes? | Notes |
|---|---|---|
| `WHERE tenantId = ?` | ✅ 1/64 | Core tenant isolation path |
| `WHERE tenantId = ? AND resDate BETWEEN ? AND ?` | ✅ 1/64, then index range | Best case |
| `WHERE email = ?` (no tenantId) | ❌ all 64 | **Must add tenantId** — see §5.3 |
| Cross-tenant admin/reporting aggregates | ❌ all 64 | Acceptable; use the reporting read-replica (§6) |
| `JOIN Reservations r JOIN Payments p ON r.id=p.reservationId` | ⚠️ only if both carry `tenantId` in predicate | Joins across partitions on PK alone scan all of `Payments` |

### 5.2 In-partition index strategy
Keep the existing secondary indexes **inside** each partition — partitioning does not replace indexing:
- `Reservations`: `KEY(customerId)`, `KEY(tenantId)` (now redundant with PK prefix but kept for non-tenant scans), `FULLTEXT(notes)`.
- `Payments`: `KEY(reservationId)`, `KEY(tenantId)`.
- `Customers`: `UNIQUE(tenantId, email)` (the partition-keyed unique), `KEY(tenantId)`.
- **Add** `Reservations KEY(tenantId, resDate)` for the dominant "this tenant's reservations this month" report query — composite within-partition index, cheap because already pruned to one partition.

### 5.3 ORM / Sequelize impact
- **All DAO/service queries must filter by `tenantId`.** The codebase already wires `tenantId` into 17 DAOs / 23 services (per project memory), so queries are tenant-scoped. Verify no query does a global `Customer.findOne({ where: { email } })` — those now hit all 64 partitions. Fix by always passing `tenantId`.
- **PK change `(id)` → `(id, tenantId)`:** Sequelize `Model.init` does not declare the PK explicitly here, so the DB-level PK change is transparent to Sequelize `create`/`findByPk`. `findByPk(id)` still works (PK prefix). Bulk-insert and `bulkCreate` are unaffected.
- **`UNIQUE(tenantId, email)` unchanged** → `Customer.findOrCreate({ where: { tenantId, email } })` keeps working.
- **`NULL` tenantId rows** (legacy single-tenant data) all live in partition 0. If `tenantId` is later made `NOT NULL`, those rows must be backfilled first (§7).

### 5.4 Maintenance operations
- **Add partition:** `ALTER TABLE ... ADD PARTITION PARTITIONS n` (instant metadata for `LINEAR KEY` growth; row redistribution is incremental).
- **Split/merge:** `REORGANIZE PARTITION` (heavier; prefer `ADD`/`COALESCE` with `LINEAR KEY`).
- **No time-based purge** — we partition by tenant, not date, so old reservations are not dropped by partition. Retention must be handled by application-level `DELETE` (or a future RANGE sub-partition if cold-data archival is needed).

---

## 6. Monitoring & Partition Health

1. **Pruning effectiveness** — capture slow queries; alert on full-partition scans:
   ```sql
   SELECT * FROM performance_schema.events_statements_summary_by_digest
   WHERE DIGEST_TEXT LIKE '%FROM Reservations%' AND NO_INDEX_USED > 0;
   ```
2. **Skew detection** — row count per partition should be roughly uniform (±20% at 10M scale):
   ```sql
   SELECT PARTITION_NAME, TABLE_ROWS
   FROM information_schema.PARTITIONS
   WHERE TABLE_SCHEMA='reserve' AND TABLE_NAME='Reservations';
   ```
   A partition at >2× the mean signals a hot tenant; consider a tenant-level cache/Shard key.
3. **NULL-tenant leakage** — alert if partition `p0` row count grows unexpectedly (legacy `tenantId IS NULL` rows):
   ```sql
   SELECT COUNT(*) FROM Reservations WHERE tenantId IS NULL;
   ```
4. **Partition count vs. row pressure** — when any partition exceeds ~400k rows (Reservations) or the table exceeds 50M rows, trigger the 64→128→256 scale-out (§4.4).
5. **`open_files_limit`** — 192–768 partition files (3 tables × up to 256) must stay under `innodb_open_files` / OS `ulimit -n`; monitor `Innodb_num_open_files`.
6. **Reporting isolation** — run cross-tenant analytics (no `tenantId` predicate) on a **read replica** so they don't compete with pruned tenant traffic on the primary.

---

## 7. Recommendations / Follow-ups
1. **Make `tenantId NOT NULL`** (currently `DEFAULT NULL`) in a separate, prerequisite migration; simplifies invariants and removes the partition-0 `NULL` bucket. Backfill legacy rows first.
2. **Enforce `tenantId` in every query** via a Sequelize `beforeFind` hook or a base scope, so no code path can accidentally scan all partitions.
3. **Use `gh-ost` / `pt-osc`** for the §4 ALTERs in production — the `PARTITION BY` rewrite is a full table copy; online schema change tools avoid the lock.
4. **Add `KEY(tenantId, resDate)`** on `Reservations` as part of the migration.
5. **Document the scale-out runbook** (§4.4) in the ops runbook so on-call can execute 64→256 without an architect.

---

## 8. Migration Plan (execution order when approved)
1. Prereq: backfill + `tenantId NOT NULL` (separate PR).
2. Add `KEY(tenantId, resDate)` to `Reservations` (online, independent).
3. `Customers` partition (safest — unique already keyed).
4. `Payments` partition.
5. `Reservations` partition (has FULLTEXT + most FKs — do last, on replica cutover).
6. Post-migration: run §6 skew + pruning checks; keep rollback scripts (§4.x) ready for 24h.
7. Scale-out to 256 only when §6 threshold breached.
