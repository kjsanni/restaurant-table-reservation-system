# QA Report — Multi-Tenant Production Readiness

**Date:** 2026-07-18  
**Scope:** Backend + frontend validation of multi-tenant behavior at scale  
**Tier:** Standard (critical + high + medium)  
**Status:** DONE_WITH_CONCERNS

---

## Executive Summary

The application builds and existing tests pass, but QA confirms **the multi-tenant module is not production-ready**. The root causes are real, reproducible, and affect correctness first, scale second.

| Area | Status | Evidence |
|------|--------|----------|
| Backend unit tests | ✅ Pass | 106/106 tests pass |
| Frontend build | ✅ Pass | `npm run build` succeeds in 2.64s |
| Tenant creation endpoint | ⚠️ Auth required | Returns 401 without JWT; form in UI handles this |
| Multi-tenant data isolation | ❌ Broken | `req.tenant` never set on domain routes |
| ORM tenant scoping | ❌ Broken | Core models omit `tenantId`; inserts never write it |
| Cross-tenant uniqueness | ❌ Broken | Global `UNIQUE(email)`/`UNIQUE(username)` indexes |
| Redis cache usage | ❌ Unused | Only 1 file imports cache; zero tenant caching |
| Rate limiting | ❌ Unmounted | Limiters defined but never `app.use`'d |
| Cron safety | ❌ Unsafe | Runs on every cluster node without distributed lock |
| Tenant switcher scale | ⚠️ Unpaginated | Will break at 100k tenants |

---

## Detailed Findings

### CRITICAL

#### 1. Middleware mount order prevents tenant resolution on domain routes
- **File:** `back-end/src/utils/server.js:125-145`
- **Observed:** Domain routers register at lines 125-139. Tenant middleware `resolveTenant` + `requireActiveTenant` register at lines 140-145.
- **Impact:** Express executes middleware in registration order. A request to `/api/v1/reservations` enters the reservation router before `resolveTenant` ever runs. `req.tenant` is `undefined` for every domain route.
- **Downstream effect:** All DAO `withTenant()` helpers receive `undefined` tenant ID and return unscoped queries.

#### 2. Core Sequelize models do not declare `tenantId`
- **Files:**
  - `db/models/reservation.js` — no `tenantId`
  - `db/models/customer.js` — no `tenantId`
  - `db/models/user.js` — no `tenantId`
  - `db/models/table.js` — no `tenantId`
  - `db/models/payment.js` — no `tenantId`
- **Observed:** Migration `20260717000002` added `tenantId` columns to these tables at the DB level, but Sequelize model definitions omit the field.
- **Impact:** `Model.create()` and `Model.build()` never write `tenantId`. New rows insert with `tenantId = NULL`, breaking tenant isolation at the data layer.

#### 3. Global unique constraints block multi-tenant signup
- **Files:**
  - `db/models/customer.js:85-89` — `unique: true` on `email`
  - `db/models/user.js:28,38` — `unique: true` on `username` and `email`
- **Observed:** These indexes are global, not composite with `tenantId`.
- **Impact:** Two tenants cannot both have a user with email `admin@x.com` or a customer with email `jane@x.com`. At 100k tenants this is a hard blocker.

### HIGH

#### 4. Redis cache is effectively unused
- **Observed:** Only `DAOs/schedule.dao.js` imports `../utils/cache`. Zero tenant-aware caching anywhere.
- **Impact:** Every request performs a MySQL query to resolve the tenant. At scale this saturates the DB.

#### 5. Rate limiters are defined but not mounted
- **File:** `middleware/rateLimit.js` defines `authLimiter`, `generalLimiter`, `bulkOperationLimiter`, `adminActionLimiter`.
- **Observed:** None of these are referenced in `utils/server.js`.
- **Impact:** API is unthrottled. Under load this becomes an availability issue.

### MEDIUM

#### 6. Tenant cron runs on every PM2 cluster node
- **File:** `tenant-platform/utils/tenantCron.js`
- **Observed:** `server.js:88-89` starts `runTenantCron()` immediately and on a 6h interval on every cluster instance.
- **Impact:** Duplicate suspension runs; race conditions on tenant status updates.

#### 7. Tenant switcher fetches all tenants unpaginated
- **Observed:** `TenantSwitcher.vue` calls `tenantAdminAPI.getAll()` without pagination constraints suited for 100k rows.
- **Impact:** UI hangs or crashes when tenant count grows.

---

## Test Evidence

### Backend tests
```
Test Suites: 18 passed, 18 total
Tests:       106 passed, 106 total
```

### Frontend build
```
✓ built in 2.64s
```

### Code-level verification
- `server.js:125-145` — confirmed middleware order bug
- `db/models/{reservation,customer,user,table,payment}.js` — confirmed missing `tenantId`
- `grep` for cache imports — confirmed only 1 consumer outside tenant code

---

## Root Cause Chain

```
Middleware order bug
    ↓
req.tenant is undefined on domain routes
    ↓
withTenant() returns unscoped queries
    ↓
Even if tenantId were in models, it wouldn't be set by middleware
    ↓
Cross-tenant data leakage + global unique constraint collisions
```

---

## Recommendations

1. Fix middleware mount order first — lowest risk, highest impact.
2. Add `tenantId` to Sequelize model definitions.
3. Add migration to convert global unique indexes to composite `(tenantId, column)`.
4. Cache tenant records in Redis in `resolveTenant.js`.
5. Mount rate limiters in `server.js`.
6. Add distributed cron lock via Redis.
7. Paginate tenant switcher.
8. Defer BullMQ to phase 2 after correctness fixes are stable.

---

## Ship Readiness

**Blockers:** 3 critical correctness issues prevent production use of multi-tenant mode.  
**Recommended action:** Implement fixes in the locked priority order from `plan-eng-review`, then re-run QA.
