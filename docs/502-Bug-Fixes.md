---
title: Bug Fixes
date: 2026-06-29
tags:
  - bug-fixes
  - backend
  - frontend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[TEST-FINDINGS-2026-06-29]]"
---

# Bug Fixes

> [!note] Impact Summary
> Fixed critical data integrity issues, API gaps, UI rendering bugs, and business logic violations.

---

## Backend Fixes

### Missing GET Route for Single Reservation

> [!danger] Severity: Medium
> `GET /api/v1/reservations/:id` returned 405.

- **File**: `back-end/src/routes/reservation.router.js`, `back-end/src/controllers/reservation.controller.js`
- **Fix**: Added `getOneHandler` and registered `.get(...protectedRoute("view_reservations", ...))`
- **Impact**: Frontend can refetch single reservations after edits

### `findAllReservations` Missing `expectedTotal`

> [!danger] Severity: Medium
> API responses omitted `expectedTotal` even though DB column existed.

- **File**: `back-end/src/DAOs/reservation.dao.js`
- **Fix**: Added `"expectedTotal"` to the `attributes` array
- **Impact**: Payment auto-classification works end-to-end

### `new-reservation` 201-but-not-saved

> [!danger] Severity: Critical
> Reservations returned `201` but were never persisted.

- **File**: `back-end/src/DAOs/reservation.dao.js`
- **Fix**: Ensured transaction commit was called before response
- **Impact**: Reservations now correctly save to database

### Phone Validation Regex

> [!warning] Severity: Medium
> Regex rejected valid phone number formats.

- **Fix**: Accept 10–15 digits
- **Frontend**: Strip non-digits and cap at 15 characters
- **Backend**: Updated validation logic

### `freeTable` Soft-Delete

- Changed from hard-delete to status update (`completed`)
- Prevents cascading data loss
- Preserves audit trail

### Cancel/Delete Blocking

- `cancelReservation` and `deleteReservation` now block **seated** reservations
- Transitions: Pending → Cancelled (via status update)
- Business rule enforced at DB layer

### Missing Business Validators Restored

| Validator | Description |
|---|---|
| `isDateInThePast` | Prevent past-date reservations |
| `max: 8` capacity | Enforce seat cap |
| Closing/Opening time | Validate against restaurant hours |
| 2-min grace period | Missed reservation handling |

### Sequelize Association Fix — User ↔ Table

- Added missing reverse association in `back-end/src/db/models/user.js`:
  ```js
  User.belongsToMany(models.table, {
    through: "table_staff",
    foreignKey: "userId",
    otherKey: "tableId",
  });
  ```
- Without this, `user.getTables()` threw `user.getTables is not a function`

### Migration Issues

- Fixed casing: `"Tables"` → `"tables"` (MySQL is case-sensitive)
- Replaced risky `changeColumn` ENUM migrations with raw SQL

---

## Frontend Fixes

### `authService.js` Syntax Error
- Fixed misplaced `module.exports` block

### `EditReservation.vue`
- Added `isModal` prop so the form fits inside `PopupBox` without standalone chrome

### `TableView.vue`
- Added missing UI component imports
- Fixed field mapping

### `RestaurantTable.vue`
- Corrected color scheme (slate palette)

### `MainSidebar.vue`
- Normalized duplicate imports

### `PaymentDashboardView.vue`
- Wired `@on-canceled-reservation="loadData"` to refresh after mutations

### Stale Data After Mutation
- Missing event bindings caused manual refresh requirement after delete
- Fixed in `PaymentDashboardView.vue`, `TheReservations.vue`, and `TheSearch.vue`

---

## Fix Verification

All critical backend paths verified in `TEST-FINDINGS-2026-06-29.md`.
