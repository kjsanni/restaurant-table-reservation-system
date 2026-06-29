---
title: Backend Architecture
date: 2026-06-29
tags:
  - backend
  - architecture
  - express
  - sequelize
  - socket.io
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[401-Database-Schema]]"
  - "[[501-Security-Fixes]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
  - "[[506-Heatmap-Analytics]]"
  - "[[508-Waitlist-System]]"
---

# Backend Architecture

> [!note] Server Address
> Backend runs on `localhost:8000` with Socket.io real-time support

---

## Server Configuration

- **Health endpoint**: `GET /api/v1/health` → `{ status: "healthy", timestamp: "..." }`
- **Stats endpoint**: `GET /api/v1/stats` → Request metrics
- **CSRF endpoint**: `GET /api/v1/csrf-token` → Sets `XSRF-TOKEN` cookie
- **CORS**: Explicit origin list from `CORS_ORIGINS` env var; defaults to `http://localhost:8080` in dev
- **CSP**: Environment-aware directives via `helmet` + custom `cspHeaders`
- **CSRF**: `samesite: "strict"` with cookie-based token rotation
- **Body limit**: 10kb JSON payloads
- **Real-time**: Socket.io for `table-freed` events and live updates
- All middleware applied in `back-end/src/utils/server.js`

---

## Route Structure

### Aggregator: `back-end/src/routes/index.js`
Mounts top-level `/` and `/info` metadata routes.

### Domain Routers

| Router File | Base Path | Controllers | Key Endpoints |
|---|---|---|---|
| `auth.router.js` | `/api/v1/auth` | auth.controller | login, register, logout |
| `reservation.router.js` | `/api/v1/reservations` | reservation.controller + payment.controller | CRUD, heatmap, heatmap-v2, stats, bulk-cancel, bulk-update, choose-table, payment-summary, payments, staff |
| `table.router.js` | `/api/v1/tables` | table.controller | CRUD, staff assignment, waiting staff |
| `waitlist.router.js` | `/api/v1/waitlist` | waitlist.controller | CRUD, stats, suggest, seat |
| `payment.router.js` | `/api/v1/payments` | payment.controller | history, revenue |
| `report.router.js` | `/api/v1/reports` | report.controller | General reports |
| `schedule.router.js` | `/api/v1/schedule` | schedule.controller | Weekly hours, holidays |
| `rbac.router.js` | `/api/v1/rbac` | rbac.controller | Roles, groups, permissions |
| `auditLog.router.js` | `/api/v1/audit-logs` | auditLog.controller | Audit log queries |
| `customer.router.js` | `/api/v1/customers` | customer.controller | Customer CRUD |
| `main.controller.js` | `/`, `/info` | main.controller | Entry point, app info |

---

## Service Layer

| Service | Responsibility |
|---|---|
| `authService.js` | JWT generation/verification, rotation, login lockout |
| `reservationService.js` | Reservation creation, status transitions, validation |
| `paymentService.js` | Payment CRUD, auto-classification (deposit/partial/paid/unpaid), revenue time-series |
| `tableService.js` | Table operations, staff assignment, waiting staff lookup |
| `waitlistService.js` | Waitlist CRUD, priority suggestions, auto-seat |
| `scheduleService.js` | Operating hours, holiday management |
| `reportService.js` | Report aggregation |
| `rbacService.js` | Role/group/permission management |
| `customerService.js` | Customer CRUD, loyalty tags |

---

## Data Access Layer

### `reservation.dao.js`

| Feature | Implementation |
|---|---|
| Hybrid deletion | Active → soft-cancel; terminal → hard-delete via `.destroy()` |
| Block seated | `cancelReservation` hard-deletes seated/completed/cancelled/missed |
| Bulk Ops | Transaction-wrapped `bulkCancel`/`bulkUpdate` |
| Stats Query | Optimized `getReservationStats`, `getPaymentStatusCounts` |
| Heatmap v1 | Scoped to `pending` reservations only |
| Heatmap v2 | `getHeatmapV2` with date range + mode (`date-hour` or `calendar`) |
| Staff lookup | `getAssignedStaff`, `assignStaff`, `unassignStaff` |

### `payment.dao.js`

| Feature | Implementation |
|---|---|
| Revenue time-series | `getRevenueTimeSeries` with `day`/`week`/`month` granularity + `byMethod` breakdown |
| Auto-classification | Updates reservation `paymentStatus` based on cumulative payments vs `expectedTotal` |

### Other DAOs

- `table.dao.js` - Table CRUD, staff assignment
- `waitlist.dao.js` - Waitlist CRUD, suggestion query
- `role.dao.js` - Role CRUD + merged permission resolution
- `group.dao.js` - Group CRUD + user membership
- `loginAttempt.dao.js` - Lockout tracking
- `auditLog.dao.js` - Audit event persistence
- `auth.dao.js` - User lookup by ID
- `schedule.dao.js` - Schedule/holiday persistence

---

## Input Validation

- `InputValidationService` - Custom validation with malicious input detection
- `SecureErrorHandler` - Centralized error formatting
- `sanitize.js`middleware - Input sanitization
- Phone validation: 10–15 digits
- Business logic validators:
  - Date past-check
  - 8-seat capacity cap
  - Closing/opening time validation
  - 2-minute grace period for missed reservations
- `expectedTotal` validation on payment classification

---

## Audit Logging

- Captures `auth_failed` for 401/403 responses
- `auditLog.js` middleware logs reservation writes, table updates, RBAC changes
- Persistent audit trail for compliance
- No sensitive data logged (passwords, tokens)

---

## Rate Limiting

- `rateLimit.js` middleware protects API endpoints from brute-force
- Combined with login lockout for authentication endpoints

---

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `table-freed` | Server → Client | `{ tableId }` |
| `connection` | Client → Server | Socket handshake |

Frontend listens for `table-freed` to trigger waitlist suggestions and data refresh.
