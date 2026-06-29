---
title: Implementation Plan
date: 2026-06-29
tags:
  - plan
  - roadmap
  - features
  - implementation
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
  - "[[506-Heatmap-Analytics]]"
  - "[[508-Waitlist-System]]"
---

# Implementation Plan — Restaurant Management System

**Generated:** 2026-06-29  
**Updated:** 2026-06-29  
**Scope:** 8 features across frontend, backend, and UX  
**Stack:** Node.js/Express backend, Vue 3 + PrimeVue + Tailwind frontend, Sequelize/MySQL, Socket.io

---

## How to Read This Document

Each feature is broken into:
- **Milestones** — high-level phases
- **Tasks** — concrete, assignable steps
- **Acceptance Criteria** — "done" definition
- **Dependencies** — what must exist before starting
- **Files to touch** — concrete paths

---

## Feature 1: Role & Permission Builder UI ✅ COMPLETED

## M1 — Backend: Permission Model & API
- ✅ Database schema: `roles`, `groups`, `user_groups` tables created
- ✅ Backend model updates for `role.js`, `group.js`, `user.js`
- ✅ API endpoints under `/api/v1/rbac/*`:
  - `GET/POST /roles` — list/create roles
  - `GET/PATCH/DELETE /roles/:id` — read/update/delete role
  - `GET/POST /groups` — list/create groups
  - `GET/PATCH/DELETE /groups/:id` — read/update/delete group
  - `GET /groups/name/:name` — find group by name
  - `POST /groups/:id/users` — add user to group
  - `DELETE /groups/:id/users/:userId` — remove user from group
- ✅ Middleware integration: `requirePermission(permission)` in `auth.js`
- ✅ User-role assignment via group membership

## M2 — Frontend: Role Builder UI
- ✅ `RoleManagementView.vue` — Role matrix with permission toggles
- ✅ `GroupManagementView.vue` — Group management + member chips
- ✅ `StaffManagementView.vue` — Staff cards with permission grid
- ✅ `SidebarNavItem.vue` — Permission-based navigation visibility

## M3 — E2E Integration & Polish
- ✅ Permission model aligned across frontend and backend
- ✅ Accessibility pass on toggles and modal forms

---

## Feature 2: Audit Log Viewer ✅ COMPLETED

## M1 — Backend: Audit Log API
- ✅ `auditLog.dao.js`, `auditLog.controller.js`, `auditLog.router.js`
- ✅ `GET /api/v1/audit-logs` with pagination, filters, and search

## M2 — Frontend: Audit Log Page
- ✅ `AuditLogView.vue` at `/audit-logs`
- ✅ Filter bar with search, action type, resource type, date range
- ✅ Log table with outcome badges, pagination, and empty state

## M3 — Polish & Performance
- ✅ Spinner loading state
- ✅ Hover highlight rows

---

## Feature 3: Heatmap 2D Upgrade ✅ COMPLETED

## M1 — Backend: Extended Heatmap API
- ✅ `GET /api/v1/reservations/heatmap-v2?from=...&to=...&mode=...`
- ✅ Modes: `date-hour` (matrix) and `calendar` (daily summary)

## M2 — Frontend: Heatmap Component
- ✅ `Heatmap2D.vue` — two-axis grid and calendar drill-down
- ✅ Color scale legend (gray → blue → red)
- ✅ Date range picker and mode toggle
- ✅ Integration in `HeatmapView.vue`

## M3 — UX Polish
- ✅ Loading skeleton/spinner
- ✅ Defensive `Array.isArray` fallback
- ✅ URL hash for selected range/mode (optional)

---

## Feature 4: No-Show Rate Tracking ✅ COMPLETED

## M1 — Backend: No-Show Actions
- ✅ `PATCH /api/v1/reservations/:id` accepts `resStatus: "missed"`
- ✅ `GET /api/v1/reservations/stats` returns `noShowCount` and `noShowRate`

## M2 — Frontend: No-Show Actions & Widget
- ✅ `NoShowWidget.vue` — Total, no-shows, rate with color-coding
- ✅ Mark No-Show button on reservation cards
- ✅ Confirmation modal via `PopupBox`

## M3 — Reporting & UX Polish
- ✅ Trend indicator (↑/↓ vs previous period)
- ✅ Tooltip explaining calculation formula

---

## Feature 5: Daily & Monthly Revenue Report Dashboard ✅ COMPLETED

## Completed Work

#### Backend
- `Payment` model: Added `paidAt` with `DataTypes.NOW` default
- `payment.dao.js`: `getRevenueTimeSeries(from, to, granularity)` with `byMethod` breakdown
- `payment.controller.js`: `getRevenueTimeSeriesHandler`
- `payment.router.js`: `GET /api/v1/payments/revenue/time-series`

#### Frontend
- `RevenueReportView.vue` at `/admin/reports/revenue`
  - Preset range buttons + custom range
  - Granularity selector (Day / Week / Month)
  - Summary cards: Total Revenue, Total Transactions, Avg Transaction
  - SVG bar chart: total sales per period
  - SVG stacked bar chart: sales by payment method
- CSV export of series data

---

## Feature 6: Waitlist Auto-Seat Workflow ✅ COMPLETED (Core)

## M1 — Backend: Eligibility & Priority Logic
- ✅ `GET /api/v1/waitlist/suggest/:tableId` — FIFO + party size fit
- ✅ `POST /api/v1/waitlist/:entryId/seat?tableId=...` — auto-create reservation
- ✅ `table-freed` Socket.io event emitted on table status change

## M2 — Frontend: Suggestion UI
- ✅ Socket listener in reservation views calls `waitlistAPI.getSuggestion()`
- ✅ Suggestion banner with Accept / Override / Dismiss buttons
- ✅ `Accept` calls `waitlistAPI.seatEntry()` and refreshes data

## M3 — Edge Cases & Polish
- ✅ Empty suggestion state with toast
- ✅ Stale suggestion handling (already seated)

---

## Feature 7: Customer Profile Page 🔲 NOT STARTED

See original plan in `docs/IMPLEMENTATION-PLAN.md` (lines 455–518).

---

## Feature 8: Search Notes Indexing 🔲 NOT STARTED

See original plan in `docs/IMPLEMENTATION-PLAN.md` (lines 520–576).

---

## Feature 9: Table Floor Plan Drag-and-Drop Seating ✅ PARTIALLY COMPLETED

## M1 — Backend
- ✅ Existing `POST /api/v1/reservations/:id/choose-table` validates capacity

## M2 — Frontend: Floor Plan Component
- ✅ `FloorPlanView.vue` with drag-and-drop reservation cards onto tables
- ✅ Drag feedback: compatible tables highlight green, incompatible shows red
- ✅ Socket integration with `table-freed` events
- ⚠️ No dedicated `FloorPlan.vue` component; logic lives in the view

## M3 — UX Polish & Config
- ⚠️ Table layout configuration not implemented
- ⚠️ Touch-device fallback limited

---

## Feature 10: Staff Assignment to Tables & Reservations ✅ COMPLETED

## Backend
- `table_staff` junction table + API endpoints
- `table.dao.js`: `assignStaffToTable`, `unassignStaffFromTable`, `getWaitingStaff`
- Staff limit enforcement: 5 tables per staff member
- `user.getTables()` fix via Sequelize `belongsToMany` reverse association

## Frontend
- `StaffManagementView.vue` — Staff cards with permission grid
- `TableManagementView.vue` — Staff assignment modal with 5-table limit display
- `AssignStaff.vue` — Reusable staff assignment component
- `TableView.vue` — "Assign Staff" button on pending reservations

---

## Completed Features Summary

| Feature | Status |
|---|---|
| RBAC System | ✅ Complete |
| Audit Log Viewer | ✅ Complete |
| Heatmap 2D | ✅ Complete |
| No-Show Tracking | ✅ Complete |
| Revenue Reports | ✅ Complete |
| Waitlist + Auto-Seat | ✅ Complete |
| Staff Assignment | ✅ Complete |
| Sidebar Redesign | ✅ Complete |
| Payment Dashboard | ✅ Complete |
| Floor Plan Drag-and-Drop | ⚠️ Partial |
| Customer Profile | 🔲 Not started |
| Search Notes Indexing | 🔲 Not started |

---

## Cross-Cutting Concerns

### Performance
- All list endpoints support pagination or are scoped to current month
- Frontend search debounces at 200–300ms
- Socket events debounce identical payloads within 150ms

### Testing Strategy
- Backend: Jest tests for new DAO queries and service classification logic
- Frontend: Vitest + Vue Test Utils for components with mock API
- E2E: Playwright smoke tests for each new page

### Rollout Order (Completed)
1. **Week 1:** Security hardening, login lockout, audit logging
2. **Week 2:** RBAC system, role/group management UI
3. **Week 3:** Payment tracking + revenue reports
4. **Week 4:** Heatmap 2D, no-show widget, waitlist auto-seat
5. **Week 5:** Sidebar redesign, UI standardization

### Backlog / Out of Scope
- Table layout visual editor (admin drag to position tables)
- PDF export libraries (CSV only for now)
- SMS/email integration
- Multi-location `branchId` support
