# Event Vertical — Performance Review

**Date:** 2026-08-13  
**Scope:** Event booking queries, capacity checks, DAO patterns  
**Reviewer:** Engineering  

## Summary

Two N+1-style performance issues were identified and fixed. All queries now use SQL-level aggregation where possible. No additional indexes required beyond the migration defaults.

## Findings

### Fixed

| # | Finding | Location | Resolution |
|---|---------|----------|------------|
| P-1 | Capacity check loaded ALL confirmed bookings into memory and reduced in JS | `eventBooking.service.js:38-45` | Added `eventBookingDAO.countConfirmedByEvent()` using SQL `SUM(quantity)` |
| P-2 | Cancel booking re-fetched ticket type to read `soldCount` despite already being included in `findById` | `eventBooking.service.js:152-156` | Removed redundant `findById`; use `booking.ticketType.soldCount` from existing association |

### Indexes Verified

| Table | Index | Query Pattern | Status |
|-------|-------|---------------|--------|
| `EventBookings` | `(tenantId, eventId)` | Capacity check, booking list by event | ✅ |
| `EventBookings` | `(customerId)` | Customer booking history | ✅ |
| `EventBookings` | `(paymentReference)` | Webhook lookup | ✅ |
| `TicketTypes` | Implicit `(eventId)` via model | Ticket type listing | ✅ |

### Query Patterns Reviewed

| Query | Pattern | Efficiency |
|-------|---------|------------|
| `countConfirmedByEvent` | `SUM(quantity)` with `WHERE status='confirmed'` | ✅ O(1) index scan |
| `list` with pagination | `findAndCountAll` with `limit/offset` | ✅ Standard pagination |
| `findByReference` | Unique lookup by `paymentReference` | ✅ Indexed |
| `findById` with includes | Eager loads event, ticketType, customer | ✅ Acceptable for single-record lookups |

## Recommendations

1. **Post-v1:** Add Redis counter for real-time capacity tracking if events exceed 10,000 bookings
2. **Post-v1:** Consider read-replica for booking list queries if tenant reporting becomes heavy
3. **Post-v1:** Add `createdAt` composite index `(tenantId, createdAt)` for chronological booking feeds

## Verification

- [x] Backend tests pass: 143 suites, 1015 tests
- [x] No new DB queries added beyond aggregation
- [x] Memory footprint reduced for capacity check
