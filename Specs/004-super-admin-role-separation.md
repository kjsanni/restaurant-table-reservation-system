# Super Admin Multi-Tenant Role Separation: Implementation Plan

## Context

The multi-tenant platform has frontend entry points and backend admin routes, but no explicit super-admin role separation. Any tenant admin with `manage_tenants` permission can currently access `/admin/**` and cross-tenant management endpoints. ADR-0001 identifies this as NEG-003 and IMP-006. The existing RBAC skill and auth middleware provide the pattern; this plan adds a distinct super-admin actor without breaking current admin flows.

## Approach

### 1. Backend super-admin identity and middleware

- Add `isSuperAdmin` boolean to the `users` table via migration, default `false`.
- Seed the existing platform admin user (`admin@rtrs.com`) as the first super admin.
- Introduce `requireSuperAdmin` middleware in `back-end/src/middleware/auth.js` that checks `req.user.isSuperAdmin === true`.
- Apply `requireSuperAdmin` to all `/api/v1/admin/*` routes in `back-end/src/utils/server.js`, including tenant-management, billing, platform-audit, usage, revenue, bulk actions, plans, payments, notifications, benchmarks, and DSAR.
- Keep existing `requirePermission("manage_tenants")` checks; `requireSuperAdmin` is a higher-order gate that short-circuits before permission checks.

### 2. Frontend super-admin role enforcement

- Update `front-end/src/stores/auth.ts` to expose `isSuperAdmin` from the JWT/user payload.
- Update `front-end/src/router/index.js` `beforeEach` to redirect non-super-admin users away from `/admin/**` with a 403-style guard using `authStore.isSuperAdmin`.
- Update sidebar config (`front-end/src/config/sidebarItems.ts`) so `adminNavItems` require `platformOnly: true` and are hidden when `authStore.user.role !== 'admin'` or `!authStore.isSuperAdmin`.
- Keep `/super-admin/login` as the exclusive entry point for super admins.

### 3. Cross-cutting safety and observability

- Add `platformAuditDAO.log(...)` calls inside `requireSuperAdmin` for rejected attempts so failed cross-tenant access attempts are auditable.
- Add a frontend toast/redirect when a tenant admin hits a super-admin route manually.

### 4. Verification gates

- Backend Jest: add tests for `requireSuperAdmin` allowing super admins and rejecting tenant admins/staff on `/admin/tenants` and `/admin/overview`.
- Playwright: extend `tests/actor-entry-points.spec.ts` with a negative test that logs in as a tenant staff/user and asserts `/admin/overview` returns 403 or redirects away.
- Backend build/test + frontend build/lint/typecheck must stay green.

## Key decisions

- **Single flag over new role table**: `isSuperAdmin` on `users` is the minimum viable change; no new role model, permission matrix entry, or seeder rewrite needed.
- **Dual gate, not replacement**: `requireSuperAdmin` + `requirePermission("manage_tenants")` keeps the existing permission model for platform staff while adding a hard boundary for tenant admins.
- **Frontend guard is UX, not security**: route guard prevents accidental leaks; backend middleware is the authoritative boundary.

## Files to modify

| File | Change |
|------|--------|
| `back-end/src/db/migrations/YYYYMMDDHHMMSS-add-super-admin-flag.js` | Add `isSuperAdmin` boolean to `users` |
| `back-end/src/db/seeders/YYYYMMDDHHMMSS-super-admin-seed.js` | Seed `admin@rtrs.com` as super admin |
| `back-end/src/middleware/auth.js` | Add `requireSuperAdmin` middleware |
| `back-end/src/utils/server.js` | Wrap `/api/v1/admin/*` routers with `requireSuperAdmin` |
| `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js` | Add audit log on update (already added in prior work) |
| `back-end/src/tenant-platform/controllers/bulkAction.controller.js` | Add audit log on bulk vertical change (already added in prior work) |
| `back-end/src/__tests__/requireSuperAdmin.test.js` | New middleware tests |
| `front-end/src/stores/auth.ts` | Expose `isSuperAdmin` |
| `front-end/src/router/index.js` | Add super-admin guard in `beforeEach` |
| `front-end/src/config/sidebarItems.ts` | Enforce platform-only visibility |
| `front-end/src/views/admin/SuperAdminLoginView.vue` | Validate super-admin mode (already present) |
| `front-end/tests/actor-entry-points.spec.ts` | Add negative tenant-admin-to-super-admin test |

## Out of scope

| Item | Reason |
|------|--------|
| Separate super-admin microservice | Violates ADR-0001 monolith decision |
| New permission matrix/granular roles | YAGNI; current RBAC skill surface is sufficient |
| Subdomain-only super-admin routing | Phase 2 concern; path-based `/super-admin/login` works today |
| Multi-super-admin invitation flow | Defer until there is a named requirement for >1 super admin |

## Recommended features to add

1. **Platform audit log viewer for super admins**
   - Route: `/admin/audit`
   - Backend: filter `platform_audit_logs` by actor, tenant, action, date range
   - Frontend: `PlatformAuditLogView.vue` with export

2. **Super-admin impersonation toggle (optional)**
   - Allow super admin to “enter as tenant” for support, with explicit audit trail and forced logout back to platform view.

3. **Tenant status change notifications**
   - When a tenant is suspended/enabled, emit a platform notification and optional email to tenant admin (frontend notification center + existing email templates).

4. **Tenant onboarding progress dashboard**
   - Show tenant setup completion %, missing legal acceptances, and incomplete steps from `TenantOnboarding` model in `TenantDashboardView.vue`.

5. **Role/permission matrix editor**
   - UI for editing tenant admin permissions without DB access; backed by existing permission model in `auth.js`.

6. **Platform health / uptime widget**
   - In `SuperAdminOverviewView.vue`, add server health, queue depth, and failed-job metrics from existing Winston/BullMQ instrumentation.

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Backend tests | `cd back-end && npm test` | 56 suites / 355+ tests passing |
| Frontend build | `cd front-end && npm run build` | Clean build |
| Frontend lint | `cd front-end && npm run lint` | Clean lint |
| Frontend typecheck | `cd front-end && npx vue-tsc --noEmit` | No `isSuperAdmin` errors |
| Playwright E2E | `cd front-end && npx playwright test tests/actor-entry-points.spec.ts --project=chromium --workers=1` | 7 tests passing (6 existing + 1 negative super-admin guard test) |

## STOP conditions

- Do not proceed if `isSuperAdmin` cannot be backfilled safely for the current platform admin without downtime; pause and plan a zero-downtime data migration.
- Do not proceed if existing tenant admin tests rely on accessing `/admin/*` routes; those tests must be updated before the middleware change lands.
