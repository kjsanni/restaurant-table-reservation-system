# Spec: Multi-Tenant Production Readiness Fixes

## Problem

The multi-tenant SaaS module is scaffolded and feature-complete at the API layer, but it is **not safe for production at 100k tenants / 1M customers**. Root-cause investigation confirmed:

1. `resolveTenant` middleware is mounted after domain routers → `req.tenant` is never populated for `/reservations`, `/customers`, `/payments`, etc.
2. Core Sequelize models omit `tenantId` → inserts never write tenant isolation.
3. Global unique constraints on `email`/`username` prevent two tenants from having the same admin/customer.
4. Redis cache is connected but unused → every request performs a MySQL tenant lookup.
5. Rate limiters exist but are never mounted → API is unthrottled.
6. Cron runs on every PM2 cluster node without a distributed lock.
7. Tenant switcher fetches all tenants unpaginated.
8. No connection pool tuning, no background job queue, no partitioning/sharding strategy.

## Goals

1. Restore correct tenant isolation for every request in multi-tenant mode.
2. Make tenant data isolation enforced at the ORM/DB layer, not just in DAO helpers.
3. Reduce per-request tenant resolution cost from 1 MySQL query to cached lookup.
4. Add background processing for async work (notifications, reports, exports).
5. Add throttling and operational safety for production scale.

## Non-Goals

- Schema-per-tenant or database-per-tenant sharding.
- Moving multi-tenant code to a separate repo/service.
- Changing the existing `TENANT_MODE=enabled` feature-flag contract.

## Scope

- `back-end/src/utils/server.js`
- `back-end/src/tenant-platform/middleware/resolveTenant.js`
- `back-end/src/tenant-platform/middleware/tenantStatus.js`
- `back-end/src/db/models/*.js` (core data models)
- `back-end/src/db/migrations/*tenant-id*.js`
- `back-end/src/middleware/rateLimit.js`
- `back-end/src/tenant-platform/utils/tenantCron.js`
- `back-end/src/config/config.js`
- `back-end/src/services/notification.service.js`
- `back-end/src/services/reportService.js`
- `front-end/src/components/TenantSwitcher.vue`
- `front-end/src/services/tenantAdminAPI.js`

## Acceptance Criteria

1. With `TENANT_MODE=enabled`, `req.tenant` is populated before any domain router executes.
2. New `Customer`, `Reservation`, `User`, `Table`, `Payment`, `Waitlist`, `AuditLog`, `TimeOff`, `Shift`, `EmailTemplate`, `Role`, `Group`, `FloorPlan`, `Schedule`, `Holiday`, `ReservationStatusHistory`, `Refund`, `TableEvent`, `LoginAttempt`, `PermissionTemplate`, `StaffShift` rows created through Sequelize include `tenantId`.
3. Two tenants can both have an admin with email `admin@x.com` without unique-key collisions.
4. Tenant lookup by slug/id is cached in Redis with TTL and negative caching.
5. Rate limiters are mounted on relevant route groups and share state via Redis.
6. Tenant cron runs exactly once across PM2 cluster instances.
7. Tenant switcher supports search/pagination instead of loading all tenants.
8. Backend test suite passes after migrations and model changes.
9. No regression in single-tenant mode (`TENANT_MODE` unset/disabled).

## Implementation Order

1. Fix middleware mount order in `server.js`.
2. Add `tenantId` to core Sequelize models + composite unique indexes.
3. Add migration to convert existing global unique indexes to composite `(tenantId, column)`.
4. Cache tenant resolution in Redis.
5. Mount rate limiters with Redis store.
6. Add distributed cron lock.
7. Paginate tenant switcher.
8. Add DB connection pool config.
9. Add BullMQ queue scaffolding for notifications/reports/exports.

## Test Plan

- Backend unit tests for tenant resolution order.
- Backend integration tests confirming `tenantId` is set on created records.
- Backend tests for Redis cache hit/miss/negative cache behavior.
- Backend tests confirming cron lock prevents duplicate runs.
- Frontend tests for paginated tenant switcher behavior.
- Manual E2E check: create two tenants, create same email in both, verify isolation.
