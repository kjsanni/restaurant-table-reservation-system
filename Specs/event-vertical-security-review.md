# Event Vertical — Security Review

**Date:** 2026-08-13  
**Scope:** Event vertical endpoints, models, DAOs, services, controllers, frontend views  
**Reviewer:** Engineering  

## Summary

The event vertical follows the existing multi-tenant patterns (tenant-scoped DAOs, Sequelize ORM, RBAC middleware, CSRF tokens). No critical vulnerabilities found. One medium-severity IDOR risk was identified and fixed.

## Findings

### Medium

| # | Finding | Location | Status |
|---|---------|----------|--------|
| M-1 | `eventBookingDAO.findByReference()` allowed lookup without `tenantId`, enabling cross-tenant booking enumeration via known payment references | `back-end/src/verticals/event/DAOs/eventBooking.dao.js:64` | **Fixed** — now throws if `tenantId` is missing |

### Low

| # | Finding | Location | Status |
|---|---------|----------|--------|
| L-1 | No service-level length validation on `eventType` (relies on DB column limit of 50 chars) | `back-end/src/verticals/event/services/event.service.js:38` | Accepted — DB constraint is sufficient for v1 |
| L-2 | `metadata` JSON fields accept arbitrary data without schema validation | All event models/services | Accepted — flexible metadata is intentional; can add schema validation if needed |

### Informational

| # | Finding | Location | Status |
|---|---------|----------|--------|
| I-1 | QR codes use 128-bit randomness (`crypto.randomBytes(16)`) — adequate for event scale but could be upgraded to 256-bit if anti-collision becomes a concern | `back-end/src/verticals/event/services/event.service.js:145,274` | Noted — no action required |
| I-2 | All state-changing routes use `validateCsrfToken` middleware | `back-end/src/verticals/event/routes/*.router.js` | Compliant |
| I-3 | No `v-html` / `innerHTML` usage in new event views | Frontend event views | Compliant |

## Controls Verified

| Control | Status | Notes |
|---------|--------|-------|
| SQL injection prevention | ✅ | Sequelize ORM with parameterized queries |
| IDOR prevention | ✅ | All DAO queries scoped by `tenantId`; M-1 fixed |
| CSRF protection | ✅ | `validateCsrfToken` on all POST/PATCH/DELETE routes |
| Authentication | ✅ | `protect` middleware on all event routes |
| Authorization | ✅ | `requirePermission("view_events")` / `requirePermission("manage_events")` |
| Payment security | ✅ | Paystack HMAC webhook verification; platform-managed keys |
| XSS prevention | ✅ | Vue text interpolation only; no raw HTML injection |
| Sensitive data in logs | ✅ | No secrets/tokens logged in event services |
| Error handling | ✅ | Generic error messages returned to clients |

## Recommendations

1. **Post-v1:** Add database-level unique constraint on `EventBookings(paymentReference)` to prevent duplicate webhook processing.
2. **Post-v1:** Consider adding a `bookingIntent` table to prevent double-booking races under high concurrency.
3. **Post-v1:** Add rate limiting on `/events/checkin/:code` to prevent QR code brute-forcing.
