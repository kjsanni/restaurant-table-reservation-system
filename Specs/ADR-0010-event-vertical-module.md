---
title: "ADR-0010: Event vertical module architecture and booking flow"
status: "Accepted"
date: "2026-08-13"
authors: "Engineering"
tags: ["architecture", "event-vertical", "multi-tenant", "payments"]
supersedes: ""
superseded_by: ""
---

# ADR-0010: Event vertical module architecture and booking flow

## Status

Accepted

## Context

The platform needs to support event-driven businesses (concerts, conferences, workshops, private events) alongside the existing restaurant and salon verticals, with secure QR-code-based check-in for ticketed entry. Events have unique requirements:

- Ticketed entry with capacity management
- Guest list management with QR-code check-in
- Payment integration for ticket purchases
- Booking lifecycle: pending → confirmed → cancelled/refunded
- Ticket transfer and cancellation policies
- **Secure check-in with 7-layer fraud prevention**: HMAC-SHA256 signed QR payloads, hash-only token storage (SHA-256, raw token never persisted), signature verification before DB lookup, Redis distributed lock + DB transaction with SELECT FOR UPDATE for atomic check-in, device session binding (4h TTL prevents forwarding between scanners), scanner rate limiting (5 scans/sec/token, 10 check-ins/sec tenant-wide), and geofencing (50m Haversine radius from venue coordinates)
- **Wallet pass delivery**: Apple Wallet `.pkpass` via short URL (WhatsApp Business API cannot send `.pkpass` attachments); web viewer at `/e/:shortCode` with Add to Apple Wallet + Add to Google Pay

Existing verticals (restaurant, salon) follow a consistent pattern: centralized models in `back-end/src/db/models/`, vertical-specific DAOs/services/controllers/routes under `back-end/src/verticals/<vertical>/`, and a module manifest registered in the module loader. The event vertical should follow the same pattern.

## Decision

Adopt the **same vertical module pattern** as restaurant and salon, implemented in phases:

### Phase 1: Core event model
- `Event`, `GuestList`, `TicketType`, `QRCode` models in `back-end/src/db/models/`
- DAOs, services, controllers, routes under `back-end/src/verticals/event/`
- Feature flags: `event_guest_list`, `event_ticketing`, `event_qr_checkin`
- RBAC permissions: `view_events`, `manage_events`

### Phase 2: Booking flow
- `EventBooking` model with payment lifecycle
- Paystack payment initialization via existing platform client
- Webhook extension for `charge.success` → booking confirmation
- Customer portal: event listing, event detail, booking modal, payment redirect

### Phase 3: Management UIs
- Tenant event management: list, create, edit, delete events
- Booking management: view bookings, cancel with refund eligibility, transfer tickets
- Super-admin platform events view for cross-tenant oversight

### Phase 4: Business rules
- Capacity enforcement: reject bookings when confirmed tickets exceed `event.capacity`
- Cancellation policy: refund eligibility based on >24 hours before event
- Ticket transfer: allowed up to 24 hours before event, audit metadata logged

## Alternatives Considered

1. **Separate microservice for events** — Rejected. Increases operational complexity, breaks single-pane-of-glass UX, and contradicts existing monolith-with-modules architecture.

2. **Reuse Order/Reservation models for events** — Rejected. Events have fundamentally different domain concepts (ticket types, QR codes, guest lists, capacity) that don't map cleanly to reservations or orders.

3. **Event as a subtype of restaurant** — Rejected. Event lifecycle, pricing, and check-in semantics are distinct enough to warrant a separate vertical.

## ADR-0010-A: Partitioning Rejection for Event Tables

**Status:** Accepted
**Date:** 2026-08-14

### Context

Phase 3 migrations `20260718000004/006/007` attempted to partition `Reservations`, `Payments`, and `Customers` tables by `LINEAR KEY(tenantId)` with `NOT NULL` constraints on `tenantId`. The `QRCodes` table in the event vertical has a foreign key to `tenantId` with `ON DELETE SET NULL` semantics (same as Reservations/Payments/Customers), which means the column must remain nullable to support graceful tenant deletion.

### Decision

**Do not** apply `PARTITION BY LINEAR KEY(tenantId)` or `NOT NULL` constraints to the `QRCodes` (or any event vertical) tables. The existing Phase 3 partition migrations (which were rejected per the correction in `corrections.md`) must not be reintroduced for the event vertical.

### Rationale

1. **FK semantics conflict**: `tenantId` in `QRCodes` has `ON DELETE SET NULL` — making it `NOT NULL` would break tenant deletion cascades.
2. **Backfill already exists**: Migration `20260814000003` backfills any NULL `tenantId` values to the default tenant (id=1) for backward compatibility.
3. **Single-tenant query pattern**: Event check-ins always include tenant context from the API key, so query-time tenant filtering is sufficient for isolation without partitioning.

### Consequences

- **Positive**: No migration failures, consistent with corrected Phase 3 approach, no risk of reintroducing the partition bug.
- **Negative**: No partition-level performance optimization for very large tenants (acceptable for v1; can revisit with horizontal sharding if needed).

## Consequences

**Positive:**
- Consistent with existing restaurant/salon patterns — low cognitive load for new engineers
- Tenant-isolated by default via `withTenant()` DAO pattern
- Reuses existing payment infrastructure (Paystack splits)
- Customer portal routes guarded by `requiresVertical: "event"`

**Negative:**
- Adds 4 new tables + 1 booking table to the shared schema
- Event capacity check requires counting confirmed bookings per event — potential N+1 under high concurrency (mitigated by ticket-level `soldCount` tracking)

**Risks:**
- QR code generation uses `crypto.randomBytes` — ensure Node version supports it
- Payment webhook must remain idempotent for duplicate Paystack retries
- Capacity enforcement at service level only; race conditions possible under concurrent bookings (acceptable for v1, can add DB-level constraints later)

## References

- `back-end/src/verticals/event/` — event vertical implementation
- `back-end/src/db/models/eventBooking.js` — booking model
- `front-end/src/views/customer/CustomerPortalEventDetailView.vue` — customer booking flow
- `back-end/src/controllers/webhook.controller.js` — Paystack webhook extension
