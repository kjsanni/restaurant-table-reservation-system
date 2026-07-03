---
title: Changes Overview
date: 2026-07-02
tags:
  - audit
  - changes
  - diff
  - obsidian-index
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[900-Session-Summary]]"
  - "[[Reservations-FloorPlan]]"
---

# Changes Overview

> [!info] Work Summary
> **23 uncommitted files** in working tree across backend, frontend, and docs.

---

## Uncommitted File Inventory

### Backend (`back-end/`)
| File | Type | Description |
|---|---|---|
| `src/controllers/admin.controller.js` | New | Admin log email handler |
| `src/routes/admin.router.js` | New | Admin log email route |
| `src/services/logEmail.service.js` | New | Nodemailer log attachment service |
| `src/middleware/rateLimit.js` | Modified | Added `adminActionLimiter` |
| `src/services/recurrence.service.js` | New | Recurrence expansion engine |
| `src/DAOs/reservation.dao.js` | Modified | Added `getRecurringReservations`, loyalty DAOs |
| `src/services/reservationService.js` | Modified | Added `getRecurringReservations` |
| `src/controllers/reservation.controller.js` | Modified | Added `getRecurringHandler` |
| `src/routes/reservation.router.js` | Modified | Added `GET /recurring` |
| `src/db/migrations/20260702000003-add-reservation-recurrence.js` | New | Recurrence JSON column |
| `src/db/models/reservation.js` | Modified | Added `recurrence` JSON |
| `src/DAOs/payment.dao.js` | Modified | Added `updateSplits` |
| `src/services/paymentService.js` | Modified | Split payment validation |
| `src/db/migrations/20260702000004-add-payment-splits.js` | New | Splits JSON column |
| `src/db/models/payment.js` | Modified | Added `splits` JSON |
| `src/services/customerService.js` | Modified | Added loyalty services |
| `src/controllers/customer.controller.js` | Modified | Added loyalty handlers |
| `src/routes/customer.router.js` | Modified | Added loyalty routes |
| `src/db/migrations/20260702000005-add-customer-loyalty-points.js` | New | Points + preferences columns |
| `src/db/models/customer.js` | Modified | Added `points`, `preferences` |
| `back-end/package.json` | Modified | Added `nodemailer` |
| `back-end/src/services/recurrence.service.js` | New | Recurrence expansion engine |
| `back-end/src/services/reservationStatusHistory.service.js` | New | Status history service |
| `back-end/src/DAOs/permissionTemplate.dao.js` | New | Template DAO |
| `back-end/src/DAOs/reservationStatusHistory.dao.js` | New | Status history DAO |
| `back-end/src/services/waitlistService.js` | Modified | Uses `getBestMatch` |
| `back-end/src/controllers/table.controller.js` | Modified | Emits `waitlist-offer` on table free |

### Frontend (`front-end/`)
| File | Type | Description |
|---|---|---|
| `src/services/adminAPI.js` | New | Admin log email API |
| `src/components/AppToast.vue` | New | Toast notification component |
| `src/stores/toast.js` | New | Toast Pinia store |
| `src/App.vue` | Modified | Mounted `AppToast` |
| `src/views/AdminSettingsView.vue` | Modified | Email logs button + toast |
| `src/views/StaffManagementView.vue` | Modified | Role select fix + error handling |
| `src/services/reservationAPI.js` | Modified | Added `getRecurring()` |
| `src/views/NewReservationView.vue` | Modified | Recurrence UI |
| `src/components/EditReservation.vue` | Modified | Split payment UI |
| `src/services/customerAPI.js` | Modified | Loyalty methods |
| `src/views/CustomerProfileView.vue` | Modified | Loyalty + preferences UI |
| `src/services/roleAPI.js` | Modified | Template CRUD methods |
| `src/views/RoleManagementView.vue` | Modified | Template picker UI |
| `src/components/AppToast.vue` | New | Toast notifications |
| `src/components/WaitlistOfferBanner.vue` | New | Waitlist auto-promotion banner |
| `src/components/ReservationTimeline.vue` | New | Status timeline component |
| `src/stores/toast.js` | New | Toast Pinia store |
| `src/App.vue` | Modified | Mounted AppToast + WaitlistOfferBanner + socket init |

### Docs
| File | Type | Description |
|---|---|---|
| `docs/Reservations-FloorPlan.md` | New | 14-feature implementation plan |

---

## Schema Changes

| Migration | Table | Change |
|---|---|---|
| `20260702000003` | `reservations` | Added `recurrence` JSON |
| `20260702000004` | `payments` | Added `splits` JSON |
| `20260702000005` | `customers` | Added `points` INT, `preferences` JSON |
| `20260703000001` | `permission_templates` | New templates table |
| `20260703000002` | `reservation_status_history` | New history table |
| `20260703000003` | `reservations` | Added `mergedFromTableIds` JSON |

---

## Security & Infrastructure

- Added `adminActionLimiter` (3 req/hr) to `POST /api/v1/admin/logs/email`
- Added log cleanup: keeps 5 most recent `.log` files before emailing
- Fixed frontend `ReferenceError: logger is not defined` in `AdminSettingsView.vue`
- Fixed role select binding in `StaffManagementView.vue` to send valid enum values
