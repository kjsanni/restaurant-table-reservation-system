# Implementation Plan: Platform Hardening, Audit Logging, and Custom Privilege Sets

## Goal
Harden platform admin access, introduce immutable audit logging, add time-limited break-glass elevation, and extend the RBAC role system to support custom privilege sets — without expanding the super-admin identity beyond a single `isSuperAdmin` account.

## Scope

### In Scope
- TOTP enforcement for all platform-role and super-admin routes
- Immutable `platform_audit_log` table + middleware auto-logging
- Break-glass elevation request/approve/revoke workflow
- Custom privilege sets in RBAC role creation
- Updated admin UI for role management, break-glass, and audit log review

### Out of Scope
- Expanding super-admin into 3-tier hierarchy (`super_admin`, `super_admin_staff`, `super_admin_manager`)
- New operator CRUD entity (superseded by platform role assignment)
- ERPNext module provisioning changes
- Saloon/restaurant landing page changes

---

## P0 — Auth Hardening & Audit Logging

### 1.1 Immutable Platform Audit Log

**Backend**
- Create migration: `back-end/src/tenant-platform/migrations/YYYYMMDDHHMMSS-create-platform-audit-log.js`
  - Table: `platform_audit_log`
  - Columns: `id`, `userId` (FK users), `tenantId` (nullable), `action` (string), `resourceType` (string), `resourceId` (string, nullable), `metadata` (JSON), `createdAt`
  - No UPDATE/DELETE triggers or cascade rules
  - Index on `userId`, `tenantId`, `createdAt`, `resourceType`
- Create model: `back-end/src/tenant-platform/models/platformAuditLog.js`
- Create DAO: `back-end/src/tenant-platform/DAOs/platformAuditLog.dao.js`
  - `create(userId, tenantId, action, resourceType, resourceId, metadata)`
  - `findAllForUser(userId, filters)`
  - `findAllForTenant(tenantId, filters)`
  - `findSuspicious(filters)` — high-severity actions for anomaly detection
- Create middleware: `back-end/src/middleware/platformAudit.js`
  - Auto-logs every mutation on protected platform routes
  - Captures: `req.tenant?.id`, `req.user.id`, `req.ip`, `req.get('user-agent')`, `req.originalUrl`, `req.method`
  - Action values: `platform_role.assign`, `platform_role.revoke`, `tenant.create`, `tenant.update`, `tenant.delete`, `billing.update`, `compliance.update`, `break_glass.request`, `break_glass.approve`, `break_glass.revoke`
- Wire middleware into all `requireSuperAdmin` + `requirePlatformRole` routes

**Frontend**
- Add audit log API methods to `adminAPI.js`:
  - `getPlatformAuditLog(filters)` — `GET /admin/platform/audit-log`
  - `exportPlatformAuditLog(filters)` — `GET /admin/platform/audit-log/export`
- Extend `PlatformAuditLogView.vue` or create new admin view:
  - Table: timestamp, user, email, action, tenant, IP, user agent
  - Filters: user, tenant, action type, date range
  - Export CSV button

### 1.2 TOTP Enforcement for Platform Roles

**Backend**
- Update `requireSuperAdmin` in `back-end/src/middleware/auth.js`:
  - Check `user.totpEnabled === true` before granting access
  - If missing, respond with `403 requires_totp` + header `X-Require-TOTP: setup`
- Update `requirePlatformRole` in `back-end/src/middleware/auth.js`:
  - Same TOTP gate for all platform-role holders
- Update `back-end/src/middleware/adminMiddleware.js`:
  - TOTP gate for admin dashboard routes

**Frontend**
- In admin layout, detect `403 requires_totp` and redirect to `/admin/totp/setup`
- Show banner on super-admin/platform-role pages: “TOTP is required for privileged access”
- TOTP setup/confirm/disable endpoints already exist in `adminAPI.js` (`setupTOTP`, `confirmTOTP`, `disableTOTP`, `getTOTPStatus`, `regenerateBackupCodes`, `verifyBackupCode`)

### 1.3 Role Creation with Custom Privilege Sets

**Backend**
- Extend `platform-role.controller.js` or create new endpoint:
  - `POST /admin/platform/roles` — create custom platform role
  - Body: `{ key: string, label: string, description: string, permissions: string[] }`
  - Validates against allowed permission namespace: `tenant.*`, `billing.*`, `support.*`, `technical.*`, `compliance.*`
  - Prevents creating role keys that conflict with existing 5 platform roles
- Extend `listPlatformRolesHandler` to return `permissions` array for each role
- Store custom roles in `platform_roles` table or extend `User.platformRoles` JSON schema
  - Recommendation: separate `platform_roles` definition table so custom roles are tenant-scoped configurable entities

**Frontend**
- Update `PlatformRoleManagementView.vue`:
  - “Create Role” modal: key, label, description, permission checkboxes grouped by namespace
  - Permission groups: Tenant Management, Billing, Support, Technical, Compliance
  - Assign/revoke flow unchanged — works against custom roles too
- Update `adminAPI.js`:
  - `createPlatformRole(data)`, `updatePlatformRole(key, data)`, `deletePlatformRole(key)`

---

## P1 — Break-Glass Elevation

### 2.1 Break-Glass Model

**Concept**
- Default state: super-admin holds `isSuperAdmin === true` with full access
- Super-admin can optionally delegate to a lower-privilege platform role
- Any user with a platform role can request **temporary elevation** to super-admin for a specific justification + duration (max 4 hours)
- Elevation requires approval from a super-admin or manager
- All elevation actions are logged in `platform_audit_log`

**Backend**
- Create `breakGlass.controller.js`
  - `POST /admin/platform/break-glass/request` — `{ justification: string, durationMinutes: number (max 240) }`
    - Validates user has active TOTP
    - Creates pending approval record
    - Logs action
  - `POST /admin/platform/break-glass/approve/:requestId` — `{ notes?: string }`
    - Validates approver is super-admin
    - Sets `elevatedUntil` timestamp
    - Logs action
  - `POST /admin/platform/break-glass/revoke/:requestId` — early termination
    - Validates requester or approver
    - Clears `elevatedUntil`
    - Logs action
- Create `breakGlass.middleware.js`
  - `requireElevatedSuperAdmin` — checks `user.elevatedUntil > now` AND TOTP enabled
  - Use on routes that require temporary super-admin access (e.g., tenant deletion, compliance override)
- Create model/DAO for break-glass requests:
  - `break_glass_requests` table: `id`, `userId`, `approverId`, `justification`, `durationMinutes`, `status` (pending/approved/denied/expired/revoked), `elevatedUntil`, `notes`, `createdAt`, `resolvedAt`
- Cron job or middleware check: expire requests when `elevatedUntil < now`

**Frontend**
- Create `BreakGlassView.vue`
  - My Requests: submit new request, view status, countdown timer for active elevation
  - Pending Approvals: approve/deny buttons (super-admin only)
  - Activity log: recent elevation actions
- Add `adminAPI.js` methods:
  - `requestBreakGlass(justification, durationMinutes)`
  - `approveBreakGlass(requestId, notes)`
  - `revokeBreakGlass(requestId)`
  - `getBreakGlassRequests(filters)`

### 2.2 Anomaly Detection

**Backend**
- Create `anomalyDetection.service.js`
  - Rules:
    1. New-IP super-admin/platform-role login
    2. After-hours access (outside business hours configurable per tenant)
    3. Bulk tenant exports (>10 tenants in 5 minutes)
    4. Compliance-setting changes
    5. Failed→success auth bursts (>3 failures then success within 10 minutes)
    6. Elevation requests from new devices
  - Each rule produces `anomaly` record with severity (low/medium/high/critical)
  - High/critical anomalies trigger notification to security team
- Create `anomalies` table or reuse `platform_audit_log` with `anomaly` action type
- Notification integration: `notification.service.js` sends email/SMS on high-severity anomalies

**Frontend**
- Extend `SuspiciousActivityView.vue` with platform-scoped anomaly feed
- Add risk score indicators per anomaly
- Allow security team to mark anomalies as `investigating`, `resolved`, `false_positive`

---

## P2 — Offboarding Automation

### 3.1 Auto-Revoke on Deactivation

**Backend**
- Hook into user deactivation flow (`auth.dao.js` or new `user.deactivation.hook.js`)
  - On `user.isActive = false` or `user.deletedAt IS NOT NULL`:
    - Strip `platformRoles` array: `[]`
    - Set `isSuperAdmin = false`
    - Revoke all active break-glass requests
    - Log offboarding event in `platform_audit_log`
- Ensure this runs in the same transaction as user deactivation

**Frontend**
- No UI changes required — deactivation already exists in user management
- Show deactivated state in `PlatformRoleManagementView.vue` as “inactive”

---

## File Changes Summary

| File | Change |
|---|---|
| `Specs/` | This implementation plan |
| `back-end/src/tenant-platform/migrations/*-create-platform-audit-log.js` | **new** migration |
| `back-end/src/tenant-platform/models/platformAuditLog.js` | **new** model |
| `back-end/src/tenant-platform/DAOs/platformAuditLog.dao.js` | **new** DAO |
| `back-end/src/middleware/platformAudit.js` | **new** middleware |
| `back-end/src/middleware/auth.js` | Add TOTP gate to `requireSuperAdmin` + `requirePlatformRole` |
| `back-end/src/middleware/requireSuperAdmin.js` | Add TOTP + elevation check |
| `back-end/src/middleware/breakGlass.middleware.js` | **new** elevation check |
| `back-end/src/tenant-platform/controllers/breakGlass.controller.js` | **new** |
| `back-end/src/tenant-platform/routes/breakGlass.router.js` | **new** |
| `back-end/src/tenant-platform/models/breakGlassRequest.js` | **new** model |
| `back-end/src/tenant-platform/DAOs/breakGlassRequest.dao.js` | **new** DAO |
| `back-end/src/services/anomalyDetection.service.js` | **new** service |
| `back-end/src/tenant-platform/controllers/platform-role.controller.js` | Extend with custom role creation/update/delete |
| `back-end/src/tenant-platform/routes/platformRole.router.js` | Add custom role CRUD routes |
| `back-end/src/DAOs/auth.dao.js` | Add offboarding hook |
| `front-end/src/services/adminAPI.js` | Add audit log + break-glass API methods |
| `front-end/src/views/admin/PlatformRoleManagementView.vue` | Add custom role creation UI |
| `front-end/src/views/admin/BreakGlassView.vue` | **new** |
| `front-end/src/views/admin/SuspiciousActivityView.vue` | Extend with platform anomaly feed |
| `front-end/src/views/admin/PlatformAuditLogView.vue` | **new** or extend existing |

---

## Test Coverage

| Area | Tests | Target |
|---|---|---|
| Platform audit log DAO | `platformAuditLog.dao.test.js` | Immutability, query filters |
| Platform audit middleware | `platformAudit.middleware.test.js` | Auto-logging on protected routes |
| TOTP enforcement | `requireSuperAdmin.test.js`, `auth.middleware.test.js` | Deny when TOTP missing |
| Break-glass flow | `breakGlass.controller.test.js` | Request/approve/revoke/expire |
| Custom role CRUD | `platform-role.controller.test.js` | Create/update/delete custom roles |
| Anomaly detection | `anomalyDetection.service.test.js` | Rule evaluation, severity scoring |
| Offboarding hook | `auth.dao.test.js` | Revoke roles on deactivation |

**Gate:** All existing 752 tests must remain green.

---

## Verification Commands

```bash
# Backend
cd back-end && npm test
npm run migrate:up

# Frontend
cd front-end && npm run build
npm run lint
npm run test:unit
```

---

## Rollout Order (Recommended)

1. **Week 1:** Platform audit log + middleware + TOTP enforcement (P0 foundation)
2. **Week 2:** Custom privilege sets in role creation UI (P0)
3. **Week 3:** Break-glass elevation + approval workflow (P1)
4. **Week 4:** Anomaly detection + notifications (P1)
5. **Week 5:** Offboarding automation + end-to-end testing (P2)

Each week is a thin vertical slice that leaves the system in a working, testable state.

---

## Decisions (Locked)

| Decision | Rationale |
|---|---|
| Keep single `isSuperAdmin` identity | Simpler, avoids hardcoded organizational tiers into schema |
| Keep 5 platform roles as operational separations | Already implemented and tested; provides duty separation |
| Add TOTP before any role expansion | Highest ROI fraud control; independent of role schema |
| Immutable audit log before break-glass | Break-glass is useless without evidence trail |
| Custom privilege sets instead of fixed tiers | Super admin defines exact permissions per role; maximum flexibility |
| Break-glass max 4 hours | Balances operational need with risk exposure |
| Anomaly detection after core controls | Requires audit log data to be useful |
| TOTP mandatory immediately for existing platform users | No grace period; enforce on next login / route access |
| Break-glass requires secondary approval when primary super-admin is unavailable | Prevents single-point-of-failure approval bottleneck |
| Audit log retention: platform-wide 180 days | Centralized retention; no per-tenant variance |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| TOTP lockout for super-admin | Backup codes + break-glass emergency flow |
| Audit log volume | Partition by month; 90-day retention by default |
| Break-glass abuse | Approval required; max 4h; all actions logged |
| Custom role permission sprawl | Validate against allowed namespace; prevent wildcard `*` |
| Offboarding race condition | Run in same transaction as user deactivation |

---

## Open Questions

1. Should super-admin TOTP be **mandatory immediately** or with a 30-day grace period?
2. Do we need per-tenant audit log retention policies, or platform-wide 90 days?
3. Who approves break-glass requests when the only super-admin is unavailable? (Need secondary approver pool)
4. Should anomaly detection notifications go to a specific security team email, or to all super-admins?
