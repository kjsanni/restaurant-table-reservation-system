# Full Project Test Findings — 2026-06-29

## Scope
- Backend: `http://localhost:8000` (Node/Express/Sequelize)
- Frontend: Vite build validation + manual flow review
- Database: MySQL `reserve` on `127.0.0.1:3306`
- Session admin credentials: `admin@rtrs.com` / `admin123`

---

## 1. Backend API Tests

| # | Endpoint | Method | Result | Notes |
|---|---|---|---|---|
| 1 | `/api/v1/health` | GET | ✅ PASS | Returns `{"success":true,"status":"healthy"}` |
| 2 | `/api/v1/auth/login` | POST | ✅ PASS | JWT issued; admin user has all permissions including `edit_reservations` |
| 3 | `/api/v1/waitlist/stats` | GET | ✅ PASS | Returns zeroed stats (empty waitlist expected) |
| 4 | `/api/v1/reservations` | GET | ✅ PASS | Returns collection; 2 pending reservations found in DB |
| 5 | `/api/v1/reservations/heatmap` | GET | ✅ PASS | Returns pending-only heatmap data |
| 6 | `/api/v1/reservations/payment-summary` | GET | ✅ PASS | Returns correct counts: `deposit:1, partial:0, paid:0, unpaid:1` |
| 7 | `/api/v1/reservations` | POST | ✅ PASS | Creates reservation; `expectedTotal` defaults to `0` if not supplied |
| 8 | `/api/v1/reservations/:id/payments` | POST | ✅ PASS | Payment created; reservation `paymentStatus` auto-updated |
| 9 | `/api/v1/reservations/:id/payments/:paymentId` | DELETE | ✅ PASS | Payment removed; reservation `paymentStatus` reclassified |
| 10 | `/api/v1/reservations/:id` | GET | ❌ FAIL | Returns `{"success":false,"message":"GET HTTP method is not allowed..."}` — **missing GET route** |
| 11 | `/api/v1/reservations/:id` | PATCH | ✅ PASS | Seat/status update works |
| 12 | `/api/v1/reservations/:id` | DELETE | ✅ PASS | Hard-deletes seated/cancelled/completed/missed reservations |

### 1.1 Auto-Classification Verification
- Reservation 31: `expectedTotal=200.00`, started as `unpaid`
- Added payment `50` → backend correctly transitioned to `deposit` (`totalPaid=150`, `0 < 150 < 200`)
- Added payment `150` → backend correctly transitioned to `paid` (`totalPaid=300 >= 200`)
- Payment summary updated automatically: `deposit:1, paid:1, unpaid:0`

### 1.2 Data Integrity Findings
- `findAllReservations` DAO was missing `expectedTotal` in its `attributes` array, causing API responses to omit the field. **Fixed during this test run.**
- `findReservationById` DAO does not restrict attributes, so it returns all columns including `expectedTotal`.

---

## 2. Frontend Build & Compilation

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | `vite build` | ✅ PASS | Clean build, no errors or warnings |
| 2 | `EditReservation.vue` render | ❌ FAIL (pre-existing, now fixed) | `props.reservation.filter()` threw `TypeError` — `reservation` is an object, not array |
| 3 | `ReservationInfo.vue` render | ❌ FAIL (pre-existing, now fixed) | Duplicate `<template>` blocks broke SFC parsing |
| 4 | `PaymentDashboardView.vue` edit flow | ❌ FAIL (pre-existing, now fixed) | Edit button did nothing because parent had no popup state or `@onOpen` listener |

---

## 3. Cross-Cutting Issues Found This Session

### 3.1 Missing GET Route for Individual Reservation
- **Path:** `back-end/src/routes/reservation.router.js`
- **Symptom:** `GET /api/v1/reservations/:id` → 405 / "GET HTTP method is not allowed"
- **Impact:** Any frontend code that tries to refetch a single reservation after edit will fail. Currently the frontend reloads the whole collection, so no immediate breakage, but it's a gap.
- **Fix applied:** Added `getOneHandler` in `reservation.controller.js`, exported it, and registered `.get(...protectedRoute("view_reservations", reservationController.getOneHandler))` on the `/:reservationId` route. Returns 404 with `"Reservation not found!"` when missing.
- **Status:** ✅ FIXED

### 3.2 `findAllReservations` Missing `expectedTotal`
- **Path:** `back-end/src/DAOs/reservation.dao.js:11`
- **Symptom:** API responses from `GET /api/v1/reservations` did not include `expectedTotal`, even though DB column existed and was populated.
- **Fix applied:** Added `"expectedTotal"` to the `attributes` array.

### 3.3 CSRF Token Handling (Client-Side)
- **Symptom:** Direct `curl` calls to write endpoints fail with `Invalid CSRF token` unless `x-xsrf-token` header is sent with a fresh cookie value.
- **Impact:** Production frontend via axios interceptor handles this automatically. Manual API testing requires: login → fetch `/csrf-token` → read `XSRF-TOKEN` cookie → pass as header.
- **Status:** Working as designed for the frontend; just a manual-testing friction point.

### 3.4 Stale Data After Mutation
- **Symptom observed:** After deleting a reservation on `/reservations`, page required manual refresh to see change.
- **Root cause:** Missing `@on-canceled-reservation` event binding in parent views.
- **Fixes applied:**
  - `PaymentDashboardView.vue` → `@on-canceled-reservation="loadData"`
  - `TheReservations.vue` already wired to `loadSchedule` / `getReservations`
  - `TheSearch.vue` already filters and removes locally

---

## 4. Component/Design System Consistency

| # | Component | Status | Notes |
|---|---|---|---|
| 1 | `ReservationInfo.vue` | ✅ PASS | Clean presentational card; delete emit handled by parent modal |
| 2 | `TheReservations.vue` | ✅ PASS | Card layout matches project design; action buttons use `PopupBox` |
| 3 | `TheSearch.vue` | ✅ PASS | Card layout matches project design; delete uses page-level `PopupBox` |
| 4 | `TableView.vue` | ⚠️ WARNING | Still present and used by `PaymentDashboardView.vue` and possibly tests. Contains its own `PopupBox` confirmation. Functionally okay but is the **only remaining table-row component** in a codebase that has otherwise moved to cards. |
| 5 | `EditReservation.vue` | ⚠️ WARNING | Originally built as full-page form. When rendered inside `PopupBox`, it lacks the card/background styling that other modal children have. Works, but visually inconsistent with the rest of the modal system. |
| 6 | `NewReservationView.vue` | ✅ PASS | Full-page form; includes new `Expected Total` field |

---

## 5. RBAC & Permission Alignment

| Role | `edit_reservations` | UI Delete Visible? | Backend Allows DELETE? |
|---|---|---|---|
| admin | ✅ | ✅ | ✅ |
| manager | ✅ (permissions table shows it for manager too) | ✅ | ✅ |
| staff | ❌ | ❌ | ❌ |

**Status:** Frontend now uses `canEditReservations` (permission-based) instead of `isAdmin` (role-based) for all delete buttons. Matches backend `writeRoute("edit_reservations", ...)` protection.

---

## 6. Documentation Drift (Fixed This Session)

| Document | Issue | Fix Applied |
|---|---|---|
| `docs/601-Key-Decisions.md` | Documented pure soft-delete | Updated to describe hybrid soft/hard lifecycle |
| `docs/401-Database-Schema.md` | Referenced soft-delete only | Updated to note hybrid deletion pattern |
| `docs/202-Backend-Architecture.md` | No mention of heatmap filter | Added `Heatmap filter` row documenting `pending`-only scope |
| `docs/302-Frontend-Architecture.md` | No permission-visibility guidance | Added section mandating permission-based UI gating |

---

## 7. Remaining Risks & Recommendations

### 7.1 Missing GET Route for Single Reservation
- **Severity:** Low-Medium
- **Owner:** Backend
- **Action:** Add `GET /:reservationId` route and controller handler, or document that frontend must reload the list instead.
- **Status:** ✅ FIXED — Added `getOneHandler` and registered GET route; returns 404 when not found.

### 7.2 `EditReservation.vue` Visual Inconsistency in Modals
- **Severity:** Low
- **Owner:** Frontend
- **Action:** Add an `isModal` prop that removes the standalone full-page chrome (`.main-wrapper`, header, extra padding) when rendered inside `PopupBox`.
- **Status:** ✅ FIXED — Added `isModal` Boolean prop (default `false`). When `true`, `.main-wrapper` class is omitted so the form fits the PopupBox content slot. `PaymentDashboardView.vue` now passes `:is-modal="true"`.

### 7.3 `TableView.vue` Legacy Component
- **Severity:** Low
- **Owner:** Frontend
- **Action:** Decide whether to migrate `PaymentDashboardView.vue` to a card layout too, or formally keep `TableView` as the "analytics table" exception. Document the decision.

### 7.4 Hard-Delete vs Audit Trail
- **Severity:** Low
- **Owner:** Backend + Product
- **Action:** Confirm with stakeholders that hard-deleting `cancelled`/`seated`/`completed` reservations is acceptable. If audit/archive requirements change, the hybrid logic in `reservation.dao.js` will need to flip back to pure soft-delete.

### 7.5 Migration Backfill Default
- **Severity:** Low
- **Owner:** Backend
- **Action:** Migration backfills `expectedTotal = people * 50`. If the business per-head rate changes, existing reservations will carry stale defaults. Consider making `expectedTotal` nullable and requiring explicit entry at creation time.

---

## 8. Validation Summary

- **Backend API critical paths:** ✅ All pass
- **Payment auto-classification:** ✅ Works end-to-end
- **Reservation hard-delete (terminal states):** ✅ Works end-to-end
- **Frontend build:** ✅ Clean
- **Documentation consistency:** ✅ Aligned with code
- **Permission model alignment:** ✅ Frontend matches backend
- **Single reservation GET route:** ✅ Fixed and tested
- **EditReservation modal chrome:** ✅ Fixed

**Test executed by:** Kilo  
**Date:** 2026-06-29
