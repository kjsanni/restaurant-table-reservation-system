# Salon Module Audit Fixes: Implementation Plan

## Context

A full-stack audit of the salon vertical (backend + frontend + customer portal + WhatsApp flow) found that the module is substantially developed but has data-model inconsistencies, a customer-portal authorization gap, missing input validation, and a few missing admin views. This spec captures the fixes required to bring the salon module to production readiness.

## Audit Findings

### Critical

1. **Appointment model missing `end` column**
   - Table/model does not include `end`, but `whatsappAppointment.service.js` and `salonCron.js` attempt to set it. Sequelize silently drops unknown fields, so `end` is never persisted.

2. **Appointment model missing `bufferMinutes`**
   - Conflict detection reads `apt.bufferMinutes` from appointment instances, but the field does not exist. Service-level buffers are never applied during conflict checking, enabling double-booking.

3. **Customer portal authorization gap**
   - `cancelSalonAppointmentHandler` and `rebookSalonAppointmentHandler` do not verify that the appointment belongs to the authenticated customer. Any logged-in customer can cancel/rebook any appointment by guessing IDs.

### High

4. **No controller-level input validation**
   - Salon controllers pass `req.body` directly to DAOs without schema validation. Invalid payloads can reach the database.

### Medium

5. **Frontend UX anti-pattern**
   - `MarketingCampaignsView.vue` uses native `alert()` instead of the project toast/notification system.

6. **Conflict-check performance**
   - `findAvailableSlots` calls `checkConflicts` for every 30-minute slot in a loop; each call loads all appointments and filters in JavaScript. This becomes a bottleneck for busy salons.

### Low

7. **Mockup views not fully implemented**
   - Dedicated staff list view (mockup `16-staff.html`)
   - Unified schedule view (mockup `11-schedule.html`)
   - WhatsApp booking admin view (mockup `18-whatsapp-booking.html`)
   - WhatsApp payment admin view (mockup `19-whatsapp-payment.html`)

## Approach

### 1. Data model consistency

- **Add `end` to appointments**
  - Migration: add `end` DATETIME column to `appointments` table.
  - Model: add `end` to `appointment.js`.
  - Backfill: compute `end = start + durationMinutes` for existing rows.
  - Update `appointment.dao.js` `create`/`update` to persist `end` when provided, or compute it from `start + durationMinutes` when absent.

- **Add `bufferMinutes` to appointments**
  - Migration: add `bufferMinutes` INTEGER column to `appointments` table.
  - Model: add `bufferMinutes` to `appointment.js`.
  - On create/update, copy `bufferMinutes` from the associated service if not explicitly provided.
  - Update `appointmentScheduling.service.js` to use the persisted `bufferMinutes` from appointments when checking conflicts.

### 2. Customer portal ownership enforcement

- Add `customerId` filter to `appointmentDao.findById` calls in `cancelSalonAppointmentHandler` and `rebookSalonAppointmentHandler`.
- Return 404 (not 403) when the appointment does not belong to the customer to avoid leaking existence.

### 3. Input validation

- Add Zod schemas for salon controllers:
  - `appointmentSchema`: `start` ISO datetime, `durationMinutes` int ≥5, `status` enum, `paymentStatus` enum, `depositAmount` ≥0, `source` enum, `notes` string optional.
  - `serviceSchema`: `name` string 1–100, `price` decimal ≥0, `durationMinutes` int ≥5, `bufferMinutes` int ≥0, `categoryId` int optional.
  - `giftCardSchema`: `code` string, `initialAmount` decimal >0, `balance` decimal ≥0, `status` enum.
  - Reuse schemas for create and update; validate in controllers before calling DAOs.
- Return 422 with validation details on failure.

### 4. Frontend polish

- Replace `alert()` in `MarketingCampaignsView.vue` with the project’s toast/notification service.

### 5. Performance optimization

- Rewrite `findAvailableSlots` to:
  - Fetch all occupied appointments for the date in one query.
  - Compute free intervals in memory by subtracting occupied ranges from the working window.
  - Return slots without per-slot database round-trips.

### 6. Missing admin views (optional parity)

- Create `SalonStaffView.vue` for staff list and management.
- Create `SalonScheduleView.vue` combining shifts, holidays, and calendar.
- Create `SalonWhatsAppBookingsView.vue` and `SalonWhatsAppPaymentsView.vue` for admin visibility into WhatsApp flows.

## Key decisions

- **Persist computed fields:** Storing `end` and `bufferMinutes` on the appointment row simplifies queries and avoids re-joining services during conflict checks.
- **404 over 403:** Hiding resource existence behind 404 reduces information leakage for unauthorized customers.
- **Zod over manual checks:** Schema validation centralizes rules and produces consistent error payloads.

## Files to modify

| File | Change |
|------|--------|
| `back-end/src/db/migrations/YYYYMMDDHHMMSS-add-end-and-buffer-to-appointments.js` | Add `end`, `bufferMinutes` columns + backfill |
| `back-end/src/verticals/salon/models/appointment.js` | Add `end`, `bufferMinutes` fields |
| `back-end/src/verticals/salon/DAOs/appointment.dao.js` | Persist/compute `end` and `bufferMinutes` |
| `back-end/src/verticals/salon/services/appointmentScheduling.service.js` | Use persisted `bufferMinutes` from appointment |
| `back-end/src/controllers/salon-customer-portal.controller.js` | Add customer ownership filter |
| `back-end/src/verticals/salon/controllers/*.js` | Add Zod validation |
| `front-end/src/views/salon/MarketingCampaignsView.vue` | Replace `alert()` with toast |
| `back-end/src/verticals/salon/services/appointmentScheduling.service.js` | Optimize `findAvailableSlots` |
| `front-end/src/views/salon/SalonStaffView.vue` | New staff list view |
| `front-end/src/views/salon/SalonScheduleView.vue` | New unified schedule view |
| `front-end/src/views/salon/SalonWhatsAppBookingsView.vue` | New WhatsApp booking admin view |
| `front-end/src/views/salon/SalonWhatsAppPaymentsView.vue` | New WhatsApp payment admin view |
| `front-end/src/router/index.js` | Register new views |
| `front-end/src/config/sidebarItems.ts` | Add nav items |

## Out of scope

| Item | Reason |
|------|--------|
| POS hardware integration | Outside software scope |
| Machine-learning anomaly detection | Phase 2; rule-based fixes first |
| Real-time video audit | Hardware/privacy complexity |
| Full salon vertical rewrite | Module is functional; targeted fixes only |

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Backend tests | `cd back-end && npm test` | All tests pass, including new salon fixes |
| Frontend build | `cd front-end && npm run build` | Clean build |
| Frontend lint | `cd front-end && npm run lint` | Clean lint |
| Appointment end persistence | Create appointment via WhatsApp flow | `end` is stored in DB |
| Buffer conflict detection | Book two adjacent slots with service buffer | Second booking rejected |
| Customer ownership | Attempt to cancel another customer’s appointment | 404 returned |
| Input validation | POST invalid service payload | 422 with validation errors |
| Performance | Generate slots for busy date | Single DB query, no N+1 |

## STOP conditions

- Do not proceed if the appointment backfill cannot complete without downtime; plan a zero-downtime migration.
- Do not proceed if adding `bufferMinutes` to appointments breaks existing conflict-check tests; update tests first.
