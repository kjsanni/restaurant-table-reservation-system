---
title: "ADR-0002: Super-admin role hierarchy and platform role separation"
status: "Proposed"
date: "2026-08-06"
authors: "Engineering"
tags: ["architecture", "rbac", "multi-tenant", "auth"]
supersedes: ""
superseded_by: ""
---

# ADR-0002: Super-admin role hierarchy and platform role separation

## Status

Proposed

## Context

The platform already has:
- `isSuperAdmin` boolean on `users` (migration 20260724000016)
- `platformRoles` JSON array on `users` (migration 20260728000007)
- `requireSuperAdmin` middleware that treats `isSuperAdmin` and `platform_admin` as equivalent
- `requirePlatformRole(role)` middleware that also falls back to `isSuperAdmin` and `platform_admin`
- A `platform-role.controller.js` defining five platform roles: `platform_admin`, `platform_billing`, `platform_support`, `platform_technical`, `platform_compliance`

However, the current implementation conflates two distinct concepts:
1. **Super admin** — a platform-level principal with unrestricted access to all platform operations, including tenant creation/deletion, legal/compliance, and encryption key management.
2. **Platform staff** — principals with narrower, job-function-specific access to platform operations (billing, support, technical, compliance).

This conflation creates insider-threat and compromise risks: any user with `platform_admin` platform role can currently access every super-admin route, and there is no way to grant a platform staff member access to only their functional area.

Additionally, the existing `requirePlatformRole` middleware is defined but **not wired to any routes**, so the five platform roles are currently unused in the request pipeline.

## Decision

Adopt a **tiered platform-actor hierarchy** with three tiers:

| Tier | Identity | Scope |
|------|----------|-------|
| **Super admin** | `isSuperAdmin === true` | Full platform access; unrestricted. |
| **Platform admin** | `platformRoles` includes `platform_admin` | Tenant management, billing, support, compliance — but NOT super-admin-only routes (encryption, DSAR escalation, platform audit). |
| **Platform staff** | `platformRoles` includes any of `platform_billing`, `platform_support`, `platform_technical`, `platform_compliance` | Functional-area access only, enforced by `requirePlatformRole`. |

### Middleware changes

1. **`requireSuperAdmin`** — checks `req.user.isSuperAdmin === true` **only**. Remove the `platform_admin` fallback. This middleware protects truly privileged routes: platform overview, tenant creation/deletion, encryption keys, case studies, insurance documents, Shaq Express conversion funnels, and platform audit logs.

2. **`requirePlatformRole(role)`** — checks `req.user.platformRoles` for the exact role **or** any role with higher privilege in the hierarchy:
   - `platform_admin` grants access to any `platform_*` route
   - `platform_billing`, `platform_support`, `platform_technical`, `platform_compliance` grant access only to their own routes
   - `isSuperAdmin` continues to bypass all platform-role checks

3. **Route audit** — wire `requirePlatformRole` to every existing route that currently uses `requireSuperAdmin` but does not need super-admin privilege. Specifically:
   - Billing/reconciliation routes → `requirePlatformRole("platform_billing")` or `requirePlatformRole("platform_admin")`
   - Support ticket analytics → `requirePlatformRole("platform_support")` or `requirePlatformRole("platform_admin")`
   - Technical/deployment routes → `requirePlatformRole("platform_technical")` or `requirePlatformRole("platform_admin")`
   - Compliance/insurance routes → `requirePlatformRole("platform_compliance")` or `requirePlatformRole("platform_admin")`

### Role hierarchy rules

```
super_admin (isSuperAdmin=true)
  └── platform_admin
        ├── platform_billing
        ├── platform_support
        ├── platform_technical
        └── platform_compliance
```

- A higher-privilege role inherits access to all lower-privilege routes.
- A lower-privilege role **cannot** access higher-privilege routes.
- `requireSuperAdmin` is the hardest gate; nothing bypasses it except `isSuperAdmin === true`.

### Frontend changes

- Expose `isSuperAdmin` and `platformRoles` in the auth store (already present in JWT).
- Update sidebar/config to show/hide platform menu items based on `platformRoles`.
- Add a platform-role assignment UI in the super-admin panel (the controller already exists; the frontend does not).

## Consequences

### Positive

- **POS-001**: Reduces blast radius of a compromised platform staff account. A stolen `platform_billing` credential cannot delete tenants or access encryption keys.
- **POS-002**: Enables the existing `platform-role.controller.js` to actually function as designed; the five platform roles become enforceable.
- **POS-003**: Makes the permission model auditable: every platform route is gated by either `requireSuperAdmin` or `requirePlatformRole`, with no implicit fallbacks.
- **POS-004**: Preserves backward compatibility for the existing super admin (`admin@rtrs.com`); no data migration or JWT changes required.

### Negative

- **NEG-001**: Existing `platform_admin` users lose access to super-admin-only routes. This is intentional, but any automated tests or scripts relying on `platform_admin` access to `/admin/overview` or encryption routes will break and must be updated.
- **NEG-002**: The `requirePlatformRole` middleware adds a privilege-escalation path that must be tested thoroughly to prevent authorization bypass.
- **NEG-003**: Frontend must now track both `isSuperAdmin` and `platformRoles` to render the correct navigation; this adds UI complexity.

## Alternatives Considered

### Alternative: Keep single `isSuperAdmin` flag, add permission bits

- **ALT-001**: **Description**: Extend `isSuperAdmin` with bitfield permissions (e.g., `superAdminPermissions: ["tenants", "billing", "support"]`).
- **ALT-002**: **Rejection Reason**: Bitfields are harder to query, audit, and extend than discrete JSON array roles. The existing `platformRoles` array already provides the same expressiveness with better tooling support.

### Alternative: New `platform_users` table

- **ALT-003**: **Description**: Create a dedicated `platform_users` table with foreign keys to `users` and a `platform_role` enum.
- **ALT-004**: **Rejection Reason**: Unnecessary normalization. The `platformRoles` JSON column on `users` is sufficient for a small, bounded set of platform roles and avoids join overhead on every auth check.

### Alternative: Remove `platform_admin` role entirely

- **ALT-005**: **Description**: Treat only `isSuperAdmin` as the platform authority; eliminate `platform_admin` and all other platform roles.
- **ALT-006**: **Rejection Reason**: Violates least-privilege principle. The platform already has functional areas (billing, support, technical, compliance) that should not require super-admin access.

## Implementation Notes

- **IMP-001**: Update `requireSuperAdmin` to remove the `platform_admin` fallback.
- **IMP-002**: Update `requirePlatformRole` to implement the hierarchy check: `platform_admin` > `platform_billing` > `platform_support` > `platform_technical` > `platform_compliance`.
- **IMP-003**: Audit all routes currently using `requireSuperAdmin` and downgrade to `requirePlatformRole` where appropriate.
- **IMP-004**: Add tests for each middleware combination: super-admin accessing all routes, platform_admin accessing admin but not super-admin routes, platform_billing accessing only billing routes, and unauthorized access returning 403.
- **IMP-005**: Update `adminMiddleware.js` to use `requireSuperAdmin` only for truly privileged operations.
- **IMP-006**: Frontend sidebar items must be gated by `platformRoles` in addition to `isSuperAdmin`.

## References

- **REF-001**: `back-end/src/middleware/auth.js` — `requireSuperAdmin` and `requirePlatformRole`
- **REF-002**: `back-end/src/controllers/platform-role.controller.js` — platform role definitions
- **REF-003**: `back-end/src/db/migrations/20260724000016-add-super-admin-flag.js` — `isSuperAdmin` column
- **REF-004**: `back-end/src/db/migrations/20260728000007-add-platform-roles.js` — `platformRoles` column
- **REF-005**: `Specs/004-super-admin-role-separation.md` — prior implementation plan
- **REF-006**: `Specs/ADR-0001-separate-actor-entry-points.md` — accepted ADR for actor separation
