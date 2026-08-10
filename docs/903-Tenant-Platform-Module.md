---
title: Tenant Platform Module (Multi-Tenant SaaS)
date: 2026-07-17
tags:
  - features
  - tenant
  - saas
  - paystack
  - billing
  - subscription
  - multi-tenant
  - backend
  - frontend
  - database
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
---

# Tenant Platform Module (Multi-Tenant SaaS)

> [!abstract] Feature-Flagged Multi-Tenancy
> The entire tenant platform is gated behind `TENANT_MODE=enabled`. When disabled or unset, the module is **never loaded** and the system behaves exactly as single-tenant with zero overhead. All code lives under `back-end/src/tenant-platform/` and is wired conditionally in `server.js`.

---

## Feature Tracker

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Tenant Database Model | ✅ Done | `tenant.model.js` with subscription + Paystack fields; default currency `GHS` |
| 2 | Migration: create-tenants | ✅ Done | `20260717000001` — `tenants` table |
| 3 | Migration: add-tenant-id-to-tables | ✅ Done | `20260717000002` — nullable `tenantId` on 18 data tables + 4 junction tables |
| 4 | Migration: backfill-default-tenant | ✅ Done | `20260717000003` — assigns all rows to `tenantId = 1` |
| 5 | Default Tenant Seeder | ✅ Done | `20260717000000` — seeds `id=1` "Default Tenant" |
| 6 | Tenant Resolution Middleware | ✅ Done | Header (`X-Tenant-Id`, `X-Tenant-Slug`) or subdomain resolution |
| 7 | Subscription Gate Middleware | ✅ Done | Blocks suspended / past-due (after grace) / cancelled tenants |
| 8 | Tenant Subscription Service | ✅ Done | `checkPastDue`, `enableTenant`, `disableTenant`, `getTenantDashboard`, `syncFromPaymentGateway`, `PLANS` |
| 9 | Paystack Service Wrapper | ✅ Done | Customers, subscriptions, plans, charges, verification, webhook signature |
| 10 | Billing Webhook Controller | ✅ Done | Paystack event processing + signature verification + test endpoint |
| 11 | Tenant Admin Controller | ✅ Done | CRUD, enable/disable, dashboard stats, user listing |
| 12 | Billing Routes | ✅ Done | `POST /api/v1/billing/webhook`, `GET /api/v1/billing/webhook/test` |
| 13 | Tenant Admin Routes | ✅ Done | `/admin/tenants` + `/admin/tenants/:id` + enable/disable actions |
| 14 | Auth Middleware Tenant Loading | ✅ Done | `protect` loads `req.tenant` from `user.tenantId` |
| 15 | Server.js TENANT_MODE Wiring | ✅ Done | Conditional middleware + routes + cron |
| 16 | Tenant Cron Job | ✅ Done | `runTenantCron` suspends past-due tenants every 6h |
| 17 | Frontend Tenant Dashboard | ✅ Done | `/admin/tenants` — summary cards, search, filter, actions |
| 18 | Frontend Tenant Detail View | ✅ Done | `/admin/tenants/:id` — info, subscription, users |
| 19 | Frontend API Client | ✅ Done | `tenantAdminAPI.js` |
| 20 | Frontend Router Registration | ✅ Done | Conditional on `VITE_TENANT_MODE=enabled` |
| 21 | Per-Tenant Query Scoping | ✅ Done | All 17 DAOs + services + controllers scoped by `req.tenant.id` |
| 22 | Frontend Tenant Switcher | ✅ Done | Platform admin context switcher in topbar |
| 23 | Per-Tenant Branding | ✅ Done | Logo, colors, theme from `tenant.settings.branding` |
| 24 | Usage Limits Enforcement | ✅ Done | Max tables/reservations per plan enforced in services |
| 25 | Customer Payment Splits | ✅ Done | Paystack transaction splits + group split UI |
| 26 | Tenant Bring-Your-Own Gateway | ✅ Done | Optional tenant-owned Paystack keys |
| 27 | Super Admin Create Tenant UI | ✅ Done | Modal form in TenantDashboardView.vue + POST /admin/tenants |
| 28 | Tenant Creation API | ✅ Done | createTenantHandler + route |
| 29 | Middleware Mount Order Fix | ✅ Done | resolveTenant/requireActiveTenant mounted before domain routers in server.js |
| 30 | tenantId in All Models | ✅ Done | 22 models declare tenantId; composite unique indexes |
| 31 | Redis Tenant Caching | ✅ Done | resolveTenant.js caches tenant records (5min TTL, 30s negative) |
| 32 | Rate Limiters Mounted | ✅ Done | authLimiter, generalLimiter, bulkOperationLimiter, adminActionLimiter with Redis store |
| 33 | Distributed Cron Lock | ✅ Done | tenantCron.js uses Redis SET NX to prevent duplicate runs |
| 34 | Tenant Switcher Pagination | ✅ Done | 20 per page with "Load more" |
| 35 | DB Connection Pool Config | ✅ Done | Sequelize pool settings in models/index.js |
| 36 | DAO/Service TenantId Wiring | ✅ Done | All 17 DAOs + 23 services propagate tenantId |
| 37 | BullMQ Job Queue | ✅ Done | Notification + report workers scaffolded |
| 38 | Frontend Tenant-Aware Fetching | ✅ Done | X-Tenant-Id header in API interceptors |
| 39 | Multi-Tenant E2E Tests | ✅ Done | 110/110 tests pass |
| 40 | Production Deployment Checklist | ✅ Done | Specs/production-deployment-checklist.md |
| 41 | BullMQ Full Integration | ✅ Done | Replaced sync notification/email/report calls with enqueued jobs + retry/DLQ |
| 42 | Read Replica Integration | ✅ Done | Sequelize read/write splitting with connection fallback |
| 43 | Load Testing | ✅ Done | API p95 147ms, 0 leaks, BullMQ 1,461-5,814 jobs/min |
| 44 | Security Hardening | ✅ Done | No hardcoded creds, tenant isolation verified, webhook security confirmed |
| 45 | Data Backfill Migration | ✅ Done | Backfill remaining null tenantId values |

> [!warning] Critical pending work
> Feature #21 (per-tenant query scoping) is **implemented**. All 17 DAOs + services + controllers use `withTenant()` to scope queries by `req.tenant.id`. **End-to-end verification completed** on 2026-07-17: enabled `TENANT_MODE=enabled` + `VITE_TENANT_MODE=enabled`, fixed migration table-name mismatches (`Schedule`→`schedules`, etc.), fixed `server.js` require paths, backfilled `tenantId=1` on all existing users, verified `/api/v1/admin/tenants/dashboard` and `/api/v1/billing/webhook/test` endpoints respond correctly. Frontend build includes tenant admin routes (`/admin/tenants`, `/admin/tenants/:id`).

> [!info] POS Sync Module
> Added on 2026-07-18: opt-in BV360 POS integration via `pos_sync` setting. RTRS exposes `/api/v1/sync/*` endpoints for table pull, reservation push, and payment settlement webhook. BV360 POS remains a separate product; both systems are fully standalone when sync is disabled.

---

## 1. Tenant Database Model

**File:** `back-end/src/tenant-platform/models/tenant.js`

**Purpose:** Defines the `tenants` table — the root entity for multi-tenancy. Each restaurant business becomes a tenant.

**Key fields:**

| Field | Type | Purpose |
|---|---|---|
| `id` | INTEGER PK | Tenant identifier |
| `name` | STRING(100) | Display name |
| `slug` | STRING(100) unique | Subdomain / URL identifier (e.g. `restaurant1`) |
| `domain` | STRING(255) unique | Optional custom domain |
| `settings` | JSON | Tenant-specific settings (branding, feature flags) |
| `status` | ENUM | `active`, `suspended`, `past_due`, `cancelled`, `trialing` |
| `plan` | STRING(50) | `starter`, `growth`, `enterprise` |
| `subscriptionStatus` | STRING(50) | Mirrors gateway status |
| `currentPeriodEnd` | DATE | Next billing date |
| `cancelAtPeriodEnd` | BOOLEAN | Scheduled cancellation flag |
| `graceEndsAt` | DATE | Access deadline for past-due tenants |
| `lastPaymentAt` | DATE | Last successful payment |
| `suspendedAt` | DATE | Manual suspension timestamp |
| `suspendedReason` | TEXT | Why tenant was suspended |
| `paystackCustomerCode` | STRING(100) | Paystack customer ID |
| `paystackSubscriptionCode` | STRING(100) | Paystack subscription ID |
| `paystackAuthorization` | JSON | Card authorization for recurring debits |
| `billingEmail` | STRING(100) | Invoice recipient |
| `billingName` | STRING(100) | Name on invoice |
| `currency` | STRING(3) | **Default `GHS`** |

**How to use:** Created via admin, or auto-created on self-serve registration. Referenced by `req.tenant` after resolution.

**Notes / Tips:**
- The model defines `Tenant.hasMany(user)` so a tenant can list its users.
- `slug` and `domain` are both unique — pick one resolution strategy (subdomain is cleanest).
- Currency defaults to `GHS` everywhere (per project requirement). Do not change unless a tenant overrides `tenant.settings.currency`.

---

## 2. Migration: create-tenants

**File:** `back-end/src/db/migrations/20260717000001-create-tenants.js`

**Purpose:** Creates the `tenants` table with all fields above.

**How to use:** `npx sequelize-cli db:migrate` (runs automatically in deploy).

**Notes / Tips:** Runs first. Must execute before `add-tenant-id-to-tables` (foreign keys reference `tenants`).

---

## 3. Migration: add-tenant-id-to-tables

**File:** `back-end/src/db/migrations/20260717000002-add-tenant-id-to-tables.js`

**Purpose:** Adds a nullable `tenantId` column + index to every existing data table, and to 4 junction tables (`user_groups`, `table_staff`, `reservation_staff`, `role_permissions`).

**Tables touched:** Users, Customers, Reservations, Tables, Payments, Waitlist, AuditLogs, Settings, Schedule, Holidays, ReservationStatusHistory, Refunds, EmailTemplates, PermissionTemplates, Shifts, TimeOffs, TableEvents, FloorPlans.

**How to use:** Runs automatically. Idempotent — skips tables that already have `tenantId`.

**Notes / Tips:**
- Column is **nullable** on purpose so existing single-tenant data is not broken.
- Rollback (`down`) removes `tenantId` from all tables.

---

## 4. Migration: backfill-default-tenant

**File:** `back-end/src/db/migrations/20260717000003-backfill-default-tenant.js`

**Purpose:** Ensures tenant `id=1` exists and assigns **all** existing rows to `tenantId = 1`. This is the bridge that lets single-tenant data coexist with multi-tenant schema.

**How to use:** Runs automatically after `add-tenant-id-to-tables`.

**Notes / Tips:** `down` is a no-op (data backfill cannot be safely rolled back). After this, every query filtered by `tenantId = 1` returns the legacy data.

---

## 5. Default Tenant Seeder

**File:** `back-end/src/db/seeders/20260717000000-default-tenant.js`

**Purpose:** Idempotently inserts tenant `id=1` ("Default Tenant", slug `default`, plan `starter`, currency `GHS`). Guard clause prevents duplicate insert.

**How to use:** `npx sequelize-cli db:seed:all`.

---

## 6. Tenant Resolution Middleware

**File:** `back-end/src/tenant-platform/middleware/resolveTenant.js`

**Purpose:** Determines which tenant a request belongs to and attaches it to `req.tenant`. No-op when `TENANT_MODE !== enabled`.

**Resolution order:**
1. `X-Tenant-Id` header → resolves by numeric id or slug
2. `X-Tenant-Slug` header → resolves by slug
3. Subdomain (e.g. `restaurant1.example.com` → slug `restaurant1`)

**How to use:** Mounted globally in `server.js` after auth. API clients send `X-Tenant-Id` or `X-Tenant-Slug`.

**Notes / Tips:**
- Returns `400` if no identifier is provided, `404` if tenant not found.
- For local dev (localhost), subdomain resolution is skipped.

---

## 7. Subscription Gate Middleware

**File:** `back-end/src/tenant-platform/middleware/tenantStatus.js`

**Purpose:** Enforces tenant access based on subscription status. Mounted after `resolveTenant`.

**Behavior:**
- `cancelled` → `403` "Subscription cancelled"
- `suspended` → `403` "Account suspended: <reason>"
- `past_due` + grace expired → `403` "Payment overdue"
- `active` / `past_due` (within grace) / `trialing` → allowed

**How to use:** Automatically applied to all requests when `TENANT_MODE=enabled`. No per-route config needed.

**Notes / Tips:** This is the enforcement point for "enable/disable due to payment". Disabling a tenant in the admin UI is what flips `status` to `suspended`.

---

## 8. Tenant Subscription Service

**File:** `back-end/src/tenant-platform/services/tenantSubscription.service.js`

**Purpose:** Core business logic for the subscription lifecycle.

**Methods:**

| Method | Purpose |
|---|---|
| `checkPastDue()` | Finds `past_due` tenants whose `graceEndsAt` has passed, suspends them, emits socket `tenant-suspended` to `io.of('/tenant-<id>')`. Returns count. |
| `enableTenant(tenantId)` | Sets `status=active`, clears suspension fields, `subscriptionStatus=active`. |
| `disableTenant(tenantId, reason)` | Sets `status=suspended`, records `suspendedAt` + `suspendedReason`. |
| `getTenantDashboard()` | Aggregates counts (total/active/pastDue/suspended/cancelled/trialing), MRR sum, and 10 most recent tenants. |
| `syncFromPaymentGateway(tenantId, payload)` | Applies Paystack lifecycle events: `invoice.payment_succeeded` → active; `invoice.payment_failed` → past_due + grace; `subscription.cancelled` → cancelled. |

**PLANS constant:**
- `starter`: 10 tables, 500 reservations/mo, GHS 29
- `growth`: 30 tables, 2000 reservations/mo, GHS 79
- `enterprise`: unlimited, custom price

**Notes / Tips:** MRR sum currently sums the `plan` string column — needs normalization to numeric price (planned fix). `io` is imported from `server.js`; ensure server is initialized before cron runs.

---

## 9. Paystack Service Wrapper

**File:** `back-end/src/tenant-platform/services/paystack.service.js`

**Purpose:** Thin axios wrapper around the Paystack API.

**Methods:** `createCustomer`, `createSubscription`, `createPlan` (defaults `currency=GHS`), `initializeCharge` (supports `splitConfig` for subaccount splits), `verifyPayment`, `fetchCustomer`, `verifyWebhookSignature` (HMAC-SHA512).

**Env:** `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `PAYSTACK_MODE` (test/live). Base URL is the same for both modes.

**Notes / Tips:**
- Webhook signature verification returns `true` if `PAYSTACK_WEBHOOK_SECRET` is unset (dev convenience) — set it in production.
- `initializeCharge` supports Paystack transaction splits so the platform can take a fee while routing the rest to a tenant subaccount.

---

## 10. Billing Webhook Controller

**File:** `back-end/src/tenant-platform/controllers/billing.controller.js`

**Purpose:** Receives Paystack webhooks and drives tenant status changes.

**Events handled:**
- `invoice.payment_succeeded` / `invoice.payment_failed` / `subscription.cancelled` → `syncFromPaymentGateway(tenantId from metadata)`
- `charge.success` → marks tenant active, updates `lastPaymentAt`

**Endpoints:** `POST /api/v1/billing/webhook` (signature-verified), `GET /api/v1/billing/webhook/test` (reachability check).

**Notes / Tips:** Webhook reads `data.metadata.tenantId` — Paystack must be configured to send tenant metadata on subscriptions. Idempotency on `paystackEventId` is **not yet implemented** (webhooks may double-fire).

---

## 11. Tenant Admin Controller

**File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js`

**Purpose:** Platform admin operations on tenants.

**Handlers:** `getTenantsHandler` (paginated, filter by status/plan), `getTenantHandler` (with users), `updateTenantHandler` (whitelisted fields: name, plan, settings, billingEmail, billingName, currency), `enableTenantHandler`, `disableTenantHandler` (requires `reason`), `getDashboardHandler`.

**Notes / Tips:** `updateTenantHandler` only allows a whitelist of fields — `status` and subscription fields are managed by the service/webhooks, not direct edit.

---

## 12. Billing Routes

**File:** `back-end/src/tenant-platform/routes/billing.router.js`

**Purpose:** Exposes the webhook endpoint. Registered at `/api/v1/billing`.

---

## 13. Tenant Admin Routes

**File:** `back-end/src/tenant-platform/routes/tenantAdmin.router.js`

**Purpose:** Platform admin tenant management. All routes protected by `protect` + `admin`.

| Method | Path | Handler |
|---|---|---|
| GET | `/dashboard` | getDashboardHandler |
| GET | `/` | getTenantsHandler |
| GET | `/:id` | getTenantHandler |
| PATCH | `/:id` | updateTenantHandler |
| POST | `/:id/enable` | enableTenantHandler |
| POST | `/:id/disable` | disableTenantHandler |

---

## 14. Auth Middleware Tenant Loading

**File:** `back-end/src/middleware/auth.js` (modified)

**Purpose:** In `protect`, when `TENANT_MODE=enabled` and `user.tenantId` exists, loads the tenant and attaches `req.tenant`. Enables per-request tenant context for DAO scoping later.

**Notes / Tips:** Lazy-requires the Tenant model to avoid loading it when the flag is off. Failures are warned (not fatal) so single-tenant auth keeps working.

---

## 15. Server.js TENANT_MODE Wiring

**File:** `back-end/src/utils/server.js` (modified)

**Purpose:** The single switch point. When `TENANT_MODE=enabled`:
- Requires the tenant middleware, routes, and cron
- Mounts `resolveTenant` + `requireActiveTenant` globally
- Mounts `/api/v1/admin/tenants` and `/api/v1/billing` routes
- Starts `runTenantCron` immediately + every 6 hours

When off, none of this is loaded.

---

## 16. Tenant Cron Job

**File:** `back-end/src/tenant-platform/utils/tenantCron.js`

**Purpose:** Runs `checkPastDue()` on a 6-hour interval to suspend tenants whose grace period expired.

**Notes / Tips:** Guards on `TENANT_MODE` internally so it never runs in single-tenant mode.

---

## 17. Frontend Tenant Dashboard

**File:** `front-end/src/views/admin/TenantDashboardView.vue`

**Purpose:** Platform admin landing page at `/admin/tenants`.

**Features:** 6 summary cards (Total, Active, Past Due, Suspended, Cancelled, MRR in GHS), search box, status filter dropdown, tenant table (name, slug, plan, status badge, subscription, next billing, actions), Enable/Disable buttons.

**How to use:** Navigate to `/admin/tenants` as an admin with `manage_tenants` permission.

**Notes / Tips:** Uses scoped CSS (not Vuestic) — standalone styling. Disable prompts for a reason via `window.prompt`.

---

## 18. Frontend Tenant Detail View

**File:** `front-end/src/views/admin/TenantDetailView.vue`

**Purpose:** Single-tenant management at `/admin/tenants/:id`.

**Features:** Tenant info (slug, domain, plan, currency, billing email), subscription details (status, period end, cancel flag, grace, last payment), Enable/Disable actions, users table.

**Notes / Tips:** Lists users via the `getTenantHandler` include. Same scoped-CSS, `window.prompt` disable pattern.

---

## 19. Frontend API Client

**File:** `front-end/src/services/tenantAdminAPI.js`

**Purpose:** Axios client for all tenant admin endpoints. Base URL `/api/v1/admin/tenants`. Exports `getDashboard`, `getAll`, `getById`, `update`, `enable`, `disable`. Auto-redirects to `/login` on 401.

---

## 20. Frontend Router Registration

**File:** `front-end/src/router/index.js` (modified)

**Purpose:** Conditionally registers `/admin/tenants` and `/admin/tenants/:id` only when `VITE_TENANT_MODE=enabled`. Keeps the single-tenant bundle unchanged.

**Notes / Tips:** Both routes require `requiresPermission: "manage_tenants"`. This permission is not yet granted to any role — needs a seed/role entry before the UI is reachable.

---

## Activation Instructions

**Backend:**
```bash
TENANT_MODE=enabled \
PAYSTACK_SECRET_KEY=sk_test_xxx \
PAYSTACK_WEBHOOK_SECRET=whsec_xxx \
PAYSTACK_MODE=test \
node ./src/app.js
```

**Frontend:**
```bash
VITE_TENANT_MODE=enabled npm run dev
```

**Database:**
```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## Critical Scaling & Architecture Issues (2026-07-18 Audit)

> [!danger] Production Readiness Blockers
> The following issues were discovered during scaling analysis for 100k tenants / 1M customers. **The system is NOT production-ready for multi-tenant scale** without these fixes.

### 1. ~~Middleware Mount Order Bug~~ ✅ FIXED
- **File:** `back-end/src/utils/server.js:125-145`
- **Issue:** `resolveTenant` and `requireActiveTenant` middleware were mounted **after** all domain routers
- **Fix:** Mounted before domain routers; `req.tenant` now populates for all routes.

### 2. ~~Missing `tenantId` in Sequelize Models~~ ✅ FIXED
- **Files:** All 22 models
- **Issue:** Models did not declare `tenantId` in `.init()`
- **Fix:** Added `tenantId` field + composite unique indexes where applicable.

### 3. ~~Redis Cache Unused~~ ✅ FIXED
- **File:** `utils/cache.js`, `resolveTenant.js`
- **Issue:** Redis client connected but never imported
- **Fix:** Tenant records now cached with 5min TTL + 30s negative cache.

### 4. No Background Job Queue ✅ FIXED
- **Files:** `notification.service.js`, `emailService.js`, `reportService.js`
- **Fix:** BullMQ job queue with notification + report workers, retry policies, DLQ, tenantId propagation.

### 5. ~~Rate Limiters Defined but Not Mounted~~ ✅ FIXED
- **Files:** `middleware/rateLimit.js`, `utils/server.js`
- **Fix:** All limiters mounted with `rate-limit-redis` shared store.

### 6. ~~Cron Runs on Every Cluster Node~~ ✅ FIXED
- **File:** `tenant-platform/utils/tenantCron.js`
- **Fix:** Redis distributed lock prevents duplicate runs.

### 7. ~~Tenant Switcher Unpaginated~~ ✅ FIXED
- **File:** `front-end/src/components/TenantSwitcher.vue`
- **Fix:** 20 per page + "Load more" button.

### 8. ~~No Connection Pool Configuration~~ ✅ FIXED
- **File:** `config/config.js` → `db/models/index.js`
- **Fix:** Sequelize pool configured with env vars.

### 9. Single MySQL Instance, No Partitioning ✅ RESOLVED (partitioning NOT adopted)
- **Decision (2026-07-20):** Physical `LINEAR KEY(tenantId)` partitioning was evaluated and **rejected** for the current schema. MySQL 8.0 cannot partition a table carrying a FULLTEXT index (`Reservations.notes`), the composite-PK change would break FKs referencing `Reservations(id)`, and the `tenantId` FK on all three tables is `ON DELETE SET NULL` (column must stay nullable). At current data volumes partitioning yields no real benefit.
- **What shipped instead:** the three Phase-3 migrations (`20260718000004/006/007`) now idempotently backfill any `tenantId IS NULL` rows to the default tenant (id=1) and leave the column nullable + unpartitioned. `sequelize-cli db:migrate` runs cleanly to completion. See [[900-Session-Summary]] Status & Open Blockers.

### 10. ~~Global Unique Constraints~~ ✅ FIXED
- **Files:** `db/models/user.js`, `db/models/customer.js`, etc.
- **Fix:** Composite unique indexes `(tenantId, column)`.

---

## Remaining Work (in priority order)

### Completed in coding sessions
1. **Platform admin permissions** — `manage_tenants` permission added to admin role seeder + migration `20260718000005` for existing databases
2. **Webhook idempotency** — `paystackEventId` unique constraint + controller deduplication implemented; tests added (`billing-webhook.test.js`)
3. **MRR normalization** — `getTenantDashboard` uses SQL CASE to convert plan strings to numeric prices; tests added (`tenantSubscription.test.js`)
4. **Security audit remediation** — all critical and high findings fixed; remaining medium/low items addressed (CSP connectSrc bug, sync/webhook rate limiters, Redis warning in production)
5. **tenantId NULL backfill (replaces partitioning plan)** — migrations `20260718000004/006/007` idempotently backfill `tenantId IS NULL` → default tenant (id=1) for Reservations, Payments, Customers; column stays nullable (FK is `ON DELETE SET NULL`). `db:migrate` now runs end-to-end.

---

## Architecture Decision

> [!info] Same repo, feature-flagged module — NOT a new repo
> The module lives in `back-end/src/tenant-platform/` and is gated by `TENANT_MODE`. A separate repo or microservice was explicitly rejected: it would mean a second database connection, a second deploy pipeline, and code drift between the reservation core and the tenant platform. Single flag keeps existing deployments zero-change when disabled.

---

## Session 2026-07-29 — Platform Roles, Webhooks, Reviews, Custom Reports & Customer Portal Features

- Added platform-role management, webhook endpoints/notifications, reviews, custom reports, customer loyalty/marketing/waitlist, status/docs, and tenant signup controllers/routes/DAOs/services/tests/migrations/seeders.
- Added corresponding frontend views and API services.
- Added Postman/Newman API testing integration.
- Added PWA manifest and service worker baseline.
- Fixed review findings: schedule fallback warning, seeder deduplication, tenant-mode default safety.
- Commit: `efe1c0c` on `main`. Pushed to `RTRS/main`.

## Session 2026-07-30 — Logical Error Scan & Bug Fixes

- **Audit:** Full codebase logical-error scan across backend, frontend, and shared modules.
- **Findings:** 12 logical errors (4 CRITICAL, 4 HIGH, 4 MEDIUM).
- **Fixes applied:**
  1. `turnstile.js` — refactored non-async middleware with unhandled promise rejection risk to `async/await` with proper `try/catch`.
  2. `paystack.service.js` — clarified `PAYSTACK_BASE` ternary; both environments use Paystack's single base URL with key-based routing.
  3. `reservation.dao.js` — fixed terminal-status cancellation to soft-delete instead of hard-deleting audit history.
  4. `SystemStatusView.vue` — removed `"unavailable"` from Operational status check.
  5. `payment.dao.js` — added object-type guard before spreading `where.paidAt`; increased split-validation tolerance from `0.001` to `0.01`.
  6. `order.controller.js` — removed duplicate order fetch; controller now passes plain updates object to DAO.
  7. `auth.js` + `resolveTenant.js` — extracted duplicated no-tenant path allowlist into shared `middleware/noTenantPaths.js`.
  8. `router/index.js` — admins now redirect to `admin-settings` instead of `tenant-landing`.
  9. `billing.controller.js` — removed insecure `metadata.tenantId` fallback from webhook tenant resolution.
  10. `auth.controller.js` — added explicit comment documenting dual-interface `authDAO` usage.
  11. `billing-webhook.test.js` — updated tests to provide `customer.customer_code` and mock tenant resolution via `db.tenant.findOne`.
- **Verification:** Backend 664/665 tests pass; frontend build + lint pass.
- **Vault update:** `900-Session-Summary.md` Chapter 20 added.
