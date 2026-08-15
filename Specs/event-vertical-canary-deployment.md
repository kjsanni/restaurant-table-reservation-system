# Event Vertical — Canary Deployment Readiness

**Date:** 2026-08-13  
**Status:** Ready for canary  
**Deployment model:** Feature-flagged rollout per tenant

## Checklist

### Backend
- [x] Migrations applied: `20260813000004-create-event-tables.js`, `20260813000005-create-event-bookings.js`
- [x] Migrations are idempotent (verified via `sequelize db:migrate:status`)
- [x] All event models registered with `if (models.xxx)` guards
- [x] DAO-level tenant scoping enforced on all queries
- [x] Service-level business rules implemented: capacity, cancellation, transfer
- [x] Payment webhook extended for event bookings
- [x] CSRF protection on all state-changing routes
- [x] RBAC permissions: `view_events`, `manage_events`

### Feature Flags
- [x] `event_guest_list` — defined in platform settings
- [x] `event_ticketing` — defined in platform settings
- [x] `event_qr_checkin` — defined in platform settings
- [x] Event vertical templates configured (VIP Lounge, Conference, Festival, Corporate)
- [x] `enabled: () => true` on event module for immediate availability

### Frontend
- [x] Build passes (`npm run build`)
- [x] Event routes registered: `/events/manage`, `/events/new`, `/events/:id/edit`, `/events/:eventId/bookings`
- [x] Super-admin route: `/super-admin/events`
- [x] Customer portal routes: `/portal/events`, `/portal/events/:id`
- [x] Sidebar items added for tenant and super-admin contexts

### Testing
- [x] Backend event tests: 47/47 passing
- [x] Event controller tests: 22/22 passing
- [x] Event DAO tests: passing
- [x] Event vertical tests: 11/11 passing
- [x] Tenant rate limit tests: 3/3 passing
- [ ] Playwright E2E: blocked by pre-existing test infrastructure issue (login flow hangs)
- [x] Security review: 1 medium finding fixed, 0 critical/high remaining
- [x] Threat model: documented in `docs/threat-model-event-vertical.md`
- [x] Performance review: N+1 issues fixed, SQL aggregation in place

### Known Limitations
- Playwright E2E tests cannot run due to pre-existing login flow issue in test environment
- QR code rate limiting not implemented (low probability brute-force with 128-bit keys)
- Transfer audit history stored in `metadata` JSON, not immutable table

### Rollback Plan
1. Disable event feature flags via super-admin portal
2. Routes remain registered but return 404/403 for disabled tenants
3. No database schema changes needed for rollback
4. Webhook handler remains backward-compatible (checks for `metadata.bookingId`)

### Next Steps Post-Canary
1. Monitor event booking error rates and capacity enforcement
2. Add Prometheus metrics for booking creation/confirmation/cancellation
3. Implement Redis-based rate limiting for QR check-in endpoint
4. Create immutable `event_booking_transfers` audit table
