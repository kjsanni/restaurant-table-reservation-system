---
title: Key Decisions
date: 2026-06-29
tags:
  - decisions
  - architecture
  - patterns
  - backend
  - frontend
  - database
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[501-Security-Fixes]]"
  - "[[502-Bug-Fixes]]"
  - "[[503-UI-UX-Improvements]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
  - "[[506-Heatmap-Analytics]]"
  - "[[508-Waitlist-System]]"
  - "[[702-Login-Lockout]]"
---

# Key Decisions

> [!info] Decision Log
> Major architectural decisions made during the project lifecycle.

---

## CSS Custom Properties for Theming

- Used in `front-end/src/assets/base.css`
- Enables consistent styling across all 23 views and 33 components
- Maintains design system without CSS preprocessors

---

## Reservation Lifecycle: Hybrid Soft/Hard Delete

- Conditional deletion strategy rather than pure soft-delete
- Active reservations (`pending`, `missed`) are **soft-cancelled** via status update to `cancelled`
  - Preserves audit trail for business intelligence
  - Keeps historical data available for reporting
- Terminal reservations (`cancelled`, `seated`, `completed`, `missed`) are **hard-deleted** on subsequent cancellation/deletion requests
  - Removes clutter from active views
  - Terminal records have no further operational value
- Rationale: balances audit requirements with data hygiene and query performance
- Implementation: `reservation.dao.js` `cancelReservation()` checks status and routes to either `deleteReservation()` (soft) or `destroyReservation()` (hard)

---

## 2-Minute Grace Period

> [!tip] Reverted from 30 minutes
> Short grace period chosen for better table turnover.

- For missed reservations
- Auto-transitions after grace period expires
- Configurable in business logic

---

## JWT Rotation Design

- 256-bit secret matching NIST guidelines
- `verifyTokenWithFallback` supports secret rotation without immediate invalidation
- Allows incremental rollout of new signing keys

---

## CSP and CORS Strategy

- Environment-aware CSP: loosen restrictions in development
- CORS rejects wildcards in production
- Requires explicit `CORS_ORIGINS` configuration
- Defaults to `http://localhost:8080` in dev

---

## Deployment Rollback Guard

- `deploy-prod.sh` includes migration failure rollback
- Prevents partial deployments
- Safety net for production releases

---

## RBAC: Permissions JSON vs Separate Table

**Decision**: Store permissions as JSON blobs on `roles` and `groups` tables rather than a separate `permissions` table + pivots.

**Rationale**:
- Faster reads (no joins) for the current scale (single restaurant)
- Simpler frontend serialization
- Permissions are relatively stable; CRUD happens via admin UI, not rapid migrations
- Trade-off accepted: harder to query "which roles have permission X" at SQL level

---

## Payment Auto-Classification

**Decision**: Server-side re-evaluation on every payment add/remove.

**Rationale**:
- Prevents frontend/backend divergence
- Single source of truth for payment status
- Simple threshold logic (`totalPaid` vs `expectedTotal`)

---

## Heatmap v2: Date-Range + Mode

**Decision**: Extend existing heatmap with `mode` parameter rather than creating a separate endpoint family.

**Rationale**:
- Backward compatibility with existing `/heatmap`
- Single DAO method (`getHeatmapV2`) handles both modes
- Frontend can switch modes without route changes

---

## Socket.io for Real-Time Updates

**Decision**: Use Socket.io for `table-freed` events instead of polling.

**Rationale**:
- Low-frequency event (table status changes are rare)
- Eliminates 1–5s polling delay
- Simplifies waitlist suggestion UX

---

## Frontend State: Pinia Single Store

**Decision**: One Pinia store (`auth.js`) rather than many.

**Rationale**:
- Most state lives in component-local refs or API response caches
- Auth state is the only truly global state
- Avoids over-engineering state management for a single-restaurant app

---

## Sidebar Navigation Over Top Navbar

**Decision**: Replace top navbar with collapsible left sidebar.

**Rationale**:
- More vertical space for content
- Desktop: collapsible to icon-only mode saves space
- Mobile: drawer pattern is more touch-friendly
- Groups nav items into Guest / Staff / Admin sections
