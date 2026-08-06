---
title: "ADR-0001: Separate actor entry points for super admin, tenant admin/staff, and tenant customers"
status: "Accepted"
date: "2026-07-24"
authors: "Engineering"
tags: ["architecture", "multi-tenant", "frontend", "auth", "white-label"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Separate actor entry points for super admin, tenant admin/staff, and tenant customers

## Status

Accepted

## Context

The platform must support **professional white-labeling** for restaurant and salon tenants. That means:

- A tenant's admin/staff and customers should enter through **tenant-scoped routes** where branding (CSS variables, logo, colors) is applied immediately.
- Super admin must have a **completely separate entry point** with no tenant branding leakage.
- The customer-facing experience should be visually indistinguishable from a standalone branded site.
- All actors currently share one frontend, one login form, and one post-auth redirect, which makes white-labeling, access control, and future custom-domain support harder.

Existing code already establishes:
- Tenant branding via CSS variables in `front-end/src/composables/useTenantBranding.js`.
- Multi-tenant backend under `back-end/src/tenant-platform/`, with restaurant and salon as vertical modules under `back-end/src/verticals/`.
- Rejection of separate repo/microservice architecture for tenant platform code.

## Decision

Adopt a **three-entry-point strategy** within the existing monolith, implemented in two phases:

**Phase 1 (immediate — white-label-ready):**
- Add distinct entry routes:
  - `/super-admin/login` — super admin login; **no tenant branding**.
  - `/t/:tenantSlug/login` — tenant-scoped login for tenant admin/staff; applies tenant branding immediately after auth.
  - `/t/:tenantSlug/portal` or `/:tenantSlug` — customer-facing portal; fully branded.
- Update post-login redirects:
  - Super admin → `/admin/overview` (`SuperAdminOverviewView`).
  - Tenant admin/staff → tenant dashboard (`/admin/tenants` or tenant-specific dashboard).
  - Customer → customer portal (`/portal/*`) with tenant branding active.
- Keep single build artifact for now, but structure routing so the app can later serve different bundles per entry point.

**Phase 2 (when scale/security/white-label volume requires it):**
- Split into separate frontend entry points / Vite builds:
  - Port 8080: Super admin SPA.
  - Port 8081: Tenant admin/staff SPA (shared code, tenant context injected at runtime).
  - Port 8082: Customer portal SPA (per-tenant or white-labeled static deploy).
- Backend route groups remain shared; only frontend build/deployment and proxy configs diverge.

## Consequences

### Positive

- **POS-001**: Super admin lands on a platform dashboard that cannot accidentally inherit tenant branding or tenant data.
- **POS-002**: Tenant-scoped entry routes (`/t/:tenantSlug`) make tenant branding, logos, and CSS variables explicit at the router level, enabling white-label experiences.
- **POS-003**: Customer portal URLs can later map to custom domains (`reserve.tenantdomain.com`) by resolving `:tenantSlug` from the hostname instead of the path, with no backend re-architecture.
- **POS-004**: Keeps the monolith and backend intact; only frontend routing, guards, and login views change.
- **POS-005**: `useTenantBranding.js` and CSS variables already provide the branding mechanism — no new styling infrastructure required.

### Negative

- **NEG-001**: Router complexity increases with three guarded entry flows and tenant resolution logic.
- **NEG-002**: Tenant slug becomes a public identifier; must enforce uniqueness and handle collisions.
- **NEG-003**: Super admin and tenant admin share auth middleware — care is needed to prevent a tenant admin from accessing `/super-admin/**` by manipulating URLs.
- **NEG-004**: If Phase 2 is triggered, there is a one-time migration cost to split Vite configs, static assets, and CI pipelines.
- **NEG-005**: Customer portal SEO/privacy may require additional configuration (meta tags, noindex for tenant-private pages).

## Alternatives Considered

### Alternative: Keep single login, add role toggle

- **ALT-001**: **Description**: Retain one login form and auto-detect role after credential check.
- **ALT-002**: **Rejection Reason**: Auto-detection leaks role information in errors and conflates actor contexts before authentication. White-labeling requires branding to be applied **before** the tenant sees the login form, which a single shared form cannot guarantee.

### Alternative: Full microservice/port separation from day one

- **ALT-003**: **Description**: Three independent frontend apps, separate backend gateways, and separate auth flows.
- **ALT-004**: **Rejection Reason**: Rejected by existing project guidance: multi-tenant and billing code stays in one backend. Separate microservices would duplicate code, complicate shared-session handling, and provide no white-label benefit over a well-structured monolith with actor-scoped entry points.

### Alternative: Subdomain-only routing (no path-based tenant routes)

- **ALT-005**: **Description**: Use subdomains only (`tenant.platform.com`, `platform.com`) to separate tenant and super admin contexts.
- **ALT-006**: **Rejection Reason**: Subdomains are desirable **eventually**, but require DNS, wildcard SSL, and proxy configuration that adds operational complexity upfront. Path-based `/t/:tenantSlug` routes achieve the same UI separation today and can be replaced by subdomains in Phase 2 without backend changes.

## Implementation Notes

- **IMP-001**: Tenant branding must be applied **before** the login form renders for tenant routes (`/t/:tenantSlug/login` and `/t/:tenantSlug/portal`). Use a lightweight middleware/composable that resolves tenant by `tenantSlug` and injects CSS variables immediately.
- **IMP-002**: Super admin login must **not** trigger tenant branding resolution. Any tenant-branding middleware must short-circuit when the route is `/super-admin/**`.
- **IMP-003**: Backend auth endpoints already validate `req.user.role` and `req.tenant.id`. Phase 1 requires no backend route splitting; only frontend routing, guards, and view separation change.
- **IMP-004**: New login views reuse existing `authStore`, `authAPI`, and CSRF flow. Do not duplicate auth logic.
- **IMP-005**: Tenant slug uniqueness must be enforced at the database level (`tenants.slug` UNIQUE). Add a migration if not already present.
- **IMP-006**: Super admin routes (`/admin/**`) must remain inaccessible when a tenant context is resolved, and vice versa. Add router guards and backend middleware assertions.
- **IMP-007**: If Phase 2 is triggered, the existing single SPA must remain deployable during the transition; do not break `npm run dev` / build pipeline.

## References

- **REF-001**: `front-end/src/router/index.js` — current routing and auth guards.
- **REF-002**: `front-end/src/views/admin/SuperAdminOverviewView.vue` — super admin landing page.
- **REF-003**: `front-end/src/views/TenantDashboardView.vue` — tenant dashboard view.
- **REF-004**: `front-end/src/composables/useTenantBranding.js` — existing CSS-variable white-label mechanism.
- **REF-005**: `back-end/src/tenant-platform/` — multi-tenant backend module.
- **REF-006**: `.kilo/skills/restaurant-rbac` — RBAC rules and permission names.
- **REF-007**: `front-end/src/config/sidebarItems.ts` — sidebar items gated by `tenantOnly`, `requiresAdmin`, and `requiresPermission`.
