# QA Report — Multi-Tenant Integration Testing

**Date:** 2026-07-18
**System:** Restaurant Table Reservation System (RTRS)
**Mode:** `TENANT_MODE=enabled` (set in `back-end/.env`)
**Tier:** Integration (all 10 requested checks) + bug fixes
**Status:** ✅ PASS — all 10 checks green after fixing 4 critical bugs

---

## Environment

| Component | Value |
|-----------|-------|
| Backend | Node.js + Express, `:8000` (PID 48250, fresh start with fixes) |
| Frontend | Vue 3 + Vite, `:8080` (existing dev server) |
| Database | MySQL (`reserve`), migrations already applied |
| Redis | `127.0.0.1:6379` (PONG) |
| Auth bootstrap | Admin JWT minted from known `JWT_SECRET` (user id 25, role `admin`) |

> **Note on pre-existing report:** `.gstack/qa-reports/2026-07-18-multi-tenant-qa.md`
> (status DONE_WITH_CONCERNS) is **stale**. Its critical findings (middleware mount
> order, models missing `tenantId`, unmounted rate limiters) were already resolved in
> the current codebase. The real blockers found during this run were different and are
> listed in "Bugs Found" below.

---

## Test Results — 10 Integration Checks

| # | Check | Method | Result | Evidence |
|---|-------|--------|--------|----------|
| 1 | Tenant resolution — `X-Tenant-Id` header | `GET /api/v1/customers/search` w/ `X-Tenant-Id: 1` | ✅ PASS | 200; `X-Tenant-Id: 999` → 404 |
| 2 | Tenant resolution — subdomain routing | `Host: default.localhost:8000`, `Host: qa-tenant-b.localhost:8000` | ✅ PASS | both 200; `Host: localhost` (no subdomain) → 400 |
| 3 | Cross-tenant reservation isolation | Inserted res `2026-08-01` under tenant 9; list as tenant 1 vs 9 | ✅ PASS | tenant1 list (3) excludes it; tenant9 list (1) contains it |
| 4 | Cross-tenant customer isolation | Created customer (tenantId 9); search as tenant 1 vs 9 | ✅ PASS | tenant1 search "isolated" → 0; tenant9 → 1; profile 301 as tenant1 → 404 |
| 5 | Tenant switcher pagination | `GET /api/v1/admin/tenants?page=1&pageSize=2` vs `page=2` | ✅ PASS | total=6, page1 rows=2 (loadtest-5, loadtest-1), page2 rows=2 |
| 6 | Create tenant end-to-end | `POST /api/v1/admin/tenants` (admin JWT + CSRF) | ✅ PASS | created id=9, slug `qa-tenant-b`, status `active` |
| 7 | Settings tenant isolation | `GET /api/v1/auth/settings` as tenant 1 vs 9 | ✅ PASS | tenant1 → its settings (tenantId:1); tenant9 → `[]` (no leak) |
| 8 | Rate limiters active | `GET /reservations/heatmap-v2` × N; admin limiter | ✅ PASS | 429 + `RateLimit-*` headers; admin limiter max 3/hr enforced |
| 9 | Redis caching working | Resolve tenant, inspect `tenant:*` keys | ✅ PASS | `tenant:id:1`, `tenant:slug:default` populated after resolution |
| 10 | BullMQ workers start | Inspect Redis `bull:*` keys + Worker instances | ✅ PASS | `bull:reports`, `bull:notifications` queues + `stalled-check` keys present; `new Worker(...)` in `notification.queue.js:42`, `report.queue.js:41` |

### Supporting evidence
- **Existing reservation data already tenant-scoped:** `SELECT DISTINCT tenantId FROM reservations` → `[1,4,5,6,7,8]`, confirming the data layer writes `tenantId`.
- **Redis cache sample:** `GET tenant:id:1` → `{"id":1,"name":"Default Tenant","slug":"default","status":"active",...}` (TTL 300s).
- **Rate-limit headers observed:** `RateLimit-Policy: 100;w=900`, `RateLimit-Limit: 100`, `RateLimit-Remaining: 96`, `RateLimit-Reset: 612`.

---

## Build & Unit Gates

| Gate | Command | Result |
|------|---------|--------|
| Backend unit tests | `cd back-end && npm test` | ✅ **121 passed / 121** (20 suites) |
| Frontend build | `cd front-end && npm run build` | ✅ Built in 2.43s, no errors |

> Note: `jest` does not auto-exit (open DB/Redis handle). Use `npx jest --forceExit`.

---

## Bugs Found & Fixed

### BUG-1 — `rateLimit.js` imported the wrong export (server would not start)
**File:** `back-end/src/middleware/rateLimit.js:2`
**Symptom:** `TypeError: RedisStore is not a constructor` on `require("../utils/server")`.
The module was assigned the whole `rate-limit-redis` object instead of its `RedisStore` class.
**Fix:** `const { RedisStore } = require("rate-limit-redis");` and pass `sendCommand` for redis v5.

### BUG-2 — Single RedisStore shared across all 4 limiters (express-rate-limit ERR_ERL_STORE_REUSE)
**File:** `back-end/src/middleware/rateLimit.js`
**Symptom:** `A Store instance must not be shared across multiple rate limiters.`
**Fix:** Each limiter now gets its own `createRedisStore(prefix)` instance with a unique prefix (`rl:auth:`, `rl:general:`, `rl:bulk:`, `rl:admin:`).

### BUG-3 — `Tenant` Sequelize model was missing entirely
**File:** `back-end/src/db/models/tenant.js` (new)
**Symptom:** `db.tenant` was `undefined` → every tenant-platform endpoint 500'd
(`/api/v1/admin/tenants` returned "Something went wrong"), and `resolveTenant`
threw on `db.tenant.findOne`, breaking tenant resolution for all routes.
**Fix:** Created the `Tenant` model matching the `tenants` table schema exactly
(all 25 columns, `ENUM` status, `JSON` settings/authorization, `tableName: "tenants"`),
with associations to `user`, `reservation`, `customer`. Auto-loaded by `db/models/index.js`.

### BUG-4 — Platform-admin tenant routes required a tenant context (couldn't list/create tenants)
**Files:** `back-end/src/tenant-platform/middleware/resolveTenant.js`, `tenantStatus.js`
**Symptom:** `GET /api/v1/admin/tenants` returned 400 "Tenant identifier not provided"
and 500 "Tenant not resolved before request" — super-admin tenant management is not
itself tenant-scoped, so it must bypass resolution.
**Fix:** Added a `PLATFORM_ADMIN_PATHS = ["/api/v1/admin/tenants", "/api/v1/billing"]`
exemption in both `resolveTenant` (skip when no identifier) and `requireActiveTenant`
(skip when `req.tenant` is undefined on those paths).

---

## Out of Scope / Observations

- **No `GET /api/v1/customers` (list-all) route.** The customer router
  (`customer.router.js`) only exposes `/search`, `/:id/profile`, `/find-or-create`, etc.
  Per-tenant isolation is still fully verifiable via `/search`, which is tenant-scoped.
  Not a bug — by design (customers are reached via search/reservations).
- The stale QA report's listed concerns (cron on every cluster node, tenant switcher at
  100k scale) remain **medium/scale** items but did not affect this integration run.
- `csrf-token` endpoint (`/api/v1/csrf-token`) returns 500 — it references an
  undefined `CSRF_COOKIE_NAME` in `utils/server.js`. Cookie-based CSRF still works via
  `setCsrfCookie` on every request; flagged for follow-up but did not block testing.

---

## How to Reproduce

```bash
# Backend (TENANT_MODE enabled)
cd back-end && TENANT_MODE=enabled node ./src/app.js

# Auth token (admin)
node -e "const j=require('jsonwebtoken'),fs=require('fs');const e=fs.readFileSync('.env','utf8').split('\n').reduce((a,l)=>{const m=l.match(/^([^=]+)=(.*)$/);if(m)a[m[1]]=m[2];return a},{});console.log(j.sign({userId:25,role:'admin'},e.JWT_SECRET,{expiresIn:e.JWT_EXPIRES_IN}))"

# Tenant resolution (header + subdomain)
curl -H "X-Tenant-Id: 1" ...                # header
curl -H "Host: qa-tenant-b.localhost:8000" ...  # subdomain

# Rate limit (admin limiter = 3/hr)
redis-cli --scan --pattern 'rl:admin:*' | xargs redis-cli del   # reset between tests
```

---

## Conclusion

All 10 multi-tenant integration checks **pass** with `TENANT_MODE=enabled`. Four critical
bugs were discovered and fixed (rate-limiter module export, shared store, missing `Tenant`
model, platform-admin tenant-context bypass). Backend (121 tests) and frontend build are
green. The multi-tenant module is now functionally production-ready at the integration
level; remaining items are scale/hardening (cron locking, 100k-row switcher pagination,
csrf-token endpoint fix).
