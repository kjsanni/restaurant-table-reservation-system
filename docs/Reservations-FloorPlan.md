---
title: Reservations & Floor Plan Implementation Plan
date: 2026-07-02
tags:
  - plan
  - roadmap
  - reservations
  - floor-plan
  - customers
  - payments
related:
  - "[[IMPLEMENTATION-PLAN]]"
  - "[[100-MOC-Architecture-Overview]]"
  - "[[401-Database-Schema]]"
  - "[[504-RBAC-System]]"
---

# Reservations & Floor Plan — Implementation Plan

## Priority Matrix

| T-Shirt | Feature | Rationale |
|---|---|---|
| **XL** | Waitlist auto-promotion + notifications | Directly reduces empty tables; reuses existing waitlist + socket infrastructure |
| **L** | Reservation status timeline | Replaces scattered `resStatus` enums with explicit history; audit-friendly |
| **L** | Split bills / multiple payment methods | High operational value; uses existing `payments` table with minimal schema change |
| **M** | Recurring reservations / repeat patterns | Drives repeat business; moderate schema + calendar logic |
| **M** | Customer profiles with preferences + allergies | Low cost; leverages existing `customers` table and reservation linkage |
| **M** | Staff permission templates | Extends existing RBAC; reduces per-user overrides |
| **M** | Table combining / merging | Complex UX but high value for large parties; requires reservation linking |
| **S** | Loyalty / visit tracking | Additive to customer profile; can be schema-only initially |
| **S** | Deposit / prepayment | Payment-level flag + validation; moderate business logic |
| **S** | Table turn-time analytics | Reporting-only enhancement; uses existing reservations/payments |
| **S** | Refund workflow + audit trail | Payment lifecycle extension; requires status + reason capture |
| **S** | Email reminders / confirmations | Requires mail templates + cron/queue; high operational value |
| **S** | Walk-in queue linked to customers | Extends existing waitlist with customer_id + faster lookup |
| **XS** | Real-time table status board | Frontend-optimized; socket-driven view of existing table statuses |
| **XS** | Email templates / branding | Admin-configurable templates for existing email flows |
| **XS** | Health check / uptime endpoint | One additional route + monitoring client config |
| **XS** | DB backup scheduling + restore admin tool | Operational tooling; can use node-cron + mysqldump wrapper |
| **XS** | Sentry + frontend error boundary | Error reporting integration; no business logic |

---

## Feature A: Waitlist Auto-Promotion (XL)

### M1 — Backend: Notification Trigger
- **Task A1.1**: Add `Reservation.notifyGuest(subject, body)` or `Waitlist.notify(entry)` service
- **Task A1.2**: Emit socket event `waitlist-offer` with tableId + offer window + auto-accept fallback
- **Task A1.3**: Extend `/api/v1/waitlist/suggest/:tableId` with `offerExpiresAt`
- **Dependencies**: Existing `waitlist`, `socket.io`, `table-freed` event
- **Files**: `waitlist.service.js`, `waitlist.controller.js`, `table.dao.js`

### M2 — Backend: Auto-Seat Logic
- **Task A2.1**: On `table-freed`, call `waitlistDAO.getBestMatch(tableId)`
- **Task A2.2**: If match found and within offer window, auto-create reservation
- **Task A2.3**: Push notification via in-app toast + optional email/SMS webhook
- **Dependencies**: M1 complete; existing `reservation` creation flow
- **Files**: `waitlist.dao.js`, `reservation.service.js`

### M3 — Frontend: Offer UI
- **Task A3.1**: Add `WaitlistOfferBanner.vue` with Accept / Dismiss / timer countdown
- **Task A3.2**: Socket listener `waitlist-offer` triggers banner
- **Task A3.3**: Auto-dismiss on expiry or manual rejection
- **Dependencies**: M2 complete; existing socket setup in `App.vue`
- **Files**: `WaitlistOfferBanner.vue`, `App.vue`, `waitlistAPI.js`

### Acceptance Criteria
- [ ] When a table frees, waitlist candidates are ranked by party size fit + FIFO
- [ ] Host sees offer banner with countdown
- [ ] Accept creates reservation and removes waitlist entry
- [ ] Dismiss/expire falls back to manual management

---

## Feature B: Reservation Status Timeline (L)

### M1 — Backend: History Model & API
- **Task B1.1**: Create `reservation_status_history` table + migration
- **Task B1.2**: DAO `addStatusChange(reservationId, fromStatus, toStatus, actorId, metadata)`
- **Task B1.3**: Controller `GET /reservations/:id/history`
- **Dependencies**: Existing `reservations` table
- **Files**: `reservation_status_history` migration/model, `reservation.dao.js`, `reservation.controller.js`, `reservation.router.js`

### M2 — Backend: Event Emission
- **Task B2.1**: Emit `reservation:status-changed` socket event on every `PATCH /reservations/:id`
- **Task B2.2**: Include actor (user or system) and timestamp
- **Dependencies**: M1 complete; existing socket server
- **Files**: `reservation.controller.js`, `utils/server.js`

### M3 — Frontend: Timeline UI
- **Task B3.1**: `ReservationTimeline.vue` — vertical stepper with status icons
- **Task B3.2**: Show in `ReservationsView.vue` and `TableManagementView.vue`
- **Task B3.3**: Filter by reservation on click
- **Dependencies**: M2 complete
- **Files**: `ReservationTimeline.vue`, `ReservationCard.vue`

### Acceptance Criteria
- [ ] Every status change is persisted with actor + timestamp
- [ ] Timeline visible from reservation detail
- [ ] Socket updates reflect in real-time

---

## Feature C: Table Combining / Merging (L/M)

### M1 — Backend: Merge Support
- **Task C1.1**: Add `mergedFromTableIds` JSON column to `reservations` (nullable)
- **Task C1.2**: `PATCH /reservations/:id/merge` accepts `tableIds[]` and validates adjacency/capacity
- **Task C1.3**: Revert endpoint `PATCH /reservations/:id/unmerge`
- **Dependencies**: Existing `tables` schema + floor plan layout
- **Files**: `merge_reservation_tables` migration, `reservation.dao.js`, `reservation.controller.js`, `reservation.router.js`

### M2 — Backend: Capacity Rules
- **Task C2.1**: Prevent merging if combined capacity < reservation party size
- **Task C2.2**: Prevent merging if any table is already occupied by another reservation
- **Dependencies**: M1 complete
- **Files**: `reservation.service.js`

### M3 — Frontend: Merge UX
- **Task C3.1**: Floor plan supports multi-select (Shift+click or drag lasso)
- **Task C3.2**: Context menu "Merge for reservation"
- **Task C3.3**: Visual connector between merged tables
- **Dependencies**: M2 complete; existing `FloorPlan.vue`
- **Files**: `FloorPlan.vue`, `ReservationContextMenu.vue`

### Acceptance Criteria
- [ ] Admin can merge 2–4 adjacent tables for one reservation
- [ ] Capacity rules enforced server-side
- [ ] Merge state visible on floor plan and reservation detail

---

## Feature D: Split Bills & Multiple Payments (L)

### M1 — Backend: Payment Split Model
- **Task D1.1**: Add `paymentSplits` table or `splits` JSON on `payments`
- **Task D1.2**: `POST /payments/:id/splits` to create split lines
- **Task D1.3**: `PATCH /reservations/:id/payments` supports multiple payment methods
- **Dependencies**: Existing `payments` table + reservation association
- **Files**: `payment.dao.js`, `payment.controller.js`, `payment.router.js`

### M2 — Backend: Validation & Totals
- **Task D2.1**: Reject splits that don’t sum to reservation total
- **Task D2.2**: Support partial payments (remaining balance flag)
- **Dependencies**: M1 complete
- **Files**: `payment.service.js`

### M3 — Frontend: Split Payment UI
- **Task D3.1**: Payment modal shows amount due + Add Split button
- **Task D3.2**: Split lines with method + amount + optional tip
- **Task D3.3**: Receipt preview per split
- **Dependencies**: M2 complete
- **Files**: `PaymentDashboardView.vue`, `PaymentModal.vue`

### Acceptance Criteria
- [ ] Reservation can be closed with multiple payment methods
- [ ] Split amounts always sum to total
- [ ] Partial payments tracked as `pending_balance`

---

## Feature E: Reservation Notes & Special Occasions (M/S)

### M1 — Backend: Notes Schema
- **Task E1.1**: Add `notes` (TEXT) and `occasion` (ENUM/JSON) to `reservations`
- **Task E1.2**: `PATCH /reservations/:id` accepts `notes`, `occasion`, `tags[]`
- **Dependencies**: None
- **Files**: `reservations` migration, `reservation.model.js`, `reservation.controller.js`

### M2 — Backend: Tags/Labels
- **Task E2.1**: Add `reservation_tags` join table (reservationId, tag)
- **Task E2.2**: `POST /reservations/:id/tags` and `DELETE /reservations/:id/tags/:tag`
- **Dependencies**: M1 complete
- **Files**: `reservation_tag` migration/model, `reservation.dao.js`, `reservation.router.js`

### M3 — Frontend: Notes & Tags UI
- **Task E3.1**: Reservation card shows occasion badge (Birthday, Anniversary, etc.)
- **Task E3.2**: Inline edit for notes with auto-save
- **Task E3.3**: Tag chips with add/remove
- **Dependencies**: M2 complete
- **Files**: `ReservationCard.vue`, `EditReservation.vue`, `TheReservations.vue`

### Acceptance Criteria
- [ ] Notes and occasions editable from reservation
- [ ] Tags filterable in reservation list
- [ ] Special occasions appear as badges in floor plan and sidebar

---

## Feature F: Recurring Reservations & Repeat Patterns (M)

### M1 — Backend: Recurrence Model
- **Task F1.1**: Add `recurrence` JSON column to `reservations` (`frequency`, `interval`, `until`, `byDay[]`)
- **Task F1.2**: `POST /reservations` accepts `recurrence`
- **Task F1.3**: `GET /reservations/recurring?customerId=...` returns series
- **Dependencies**: Existing `reservations` table
- **Files**: `reservations` migration, `reservation.service.js`, `reservation.controller.js`, `reservation.router.js`

### M2 — Backend: Recurrence Engine
- **Task F2.1**: `ReservationRecurrence.expand(from, to)` returns occurrences
- **Task F2.2**: Skip dates outside schedule/holidays
- **Task F2.3**: Detect conflicts with existing reservations
- **Dependencies**: M1 complete; existing `schedule` and `holidays` tables
- **Files**: `recurrence.service.js`

### M3 — Frontend: Recurrence UI
- **Task F3.1**: Frequency selector (daily/weekly/monthly) + interval + end date
- **Task F3.2**: Calendar preview of generated reservations
- **Task F3.3**: "Edit series" vs "Edit single" modal
- **Dependencies**: M2 complete
- **Files**: `EditReservation.vue`, `NewReservationView.vue`

### Acceptance Criteria
- [ ] User can create weekly/monthly reservation series
- [ ] Conflicts flagged before saving
- [ ] Series edit updates all future instances or single instance

---

## Feature G: Customer Loyalty & Visit Tracking (M/S)

### M1 — Backend: Loyalty Schema
- **Task G1.1**: Add `visits`, `points`, `lastVisitAt`, `preferences` JSON to `customers`
- **Task G1.2**: `PATCH /reservations/:id/complete` triggers `customerDAO.incrementVisit(reservation.customerId)`
- **Task G1.3**: `GET /customers/:id/loyalty` returns stats
- **Dependencies**: Existing `customers` + `reservations` linkage
- **Files**: `customers` migration, `customer.dao.js`, `customer.controller.js`, `customer.router.js`

### M2 — Backend: Redemption Rules
- **Task G2.1**: Define redemption tiers (e.g., 10 visits = free dessert)
- **Task G2.2**: `POST /customers/:id/redeem` validates and deducts/records reward
- **Dependencies**: M1 complete
- **Files**: `customer.service.js`, `loyalty.dao.js`

### M3 — Frontend: Loyalty UI
- **Task G3.1**: Customer profile shows visit history chart + points badge
- **Task G3.2**: Reservation form suggests "Previous visits: 5"
- **Task G3.3**: Staff can mark reward as redeemed from customer page
- **Dependencies**: M2 complete
- **Files**: `CustomerProfileView.vue`, `NewReservationView.vue`

### Acceptance Criteria
- [ ] Visits increment automatically on reservation completion
- [ ] Customer profile shows lifetime stats
- [ ] Rewards redeemable with audit record

---

## Feature H: Permission Templates (M)

### M1 — Backend: Template Storage
- **Task H1.1**: Add `permission_templates` table (name, description, permissions JSON, isPublic)
- **Task H1.2**: `GET /rbac/permission-templates`, `POST /rbac/permission-templates`
- **Task H1.3**: `POST /rbac/roles/:id/apply-template/:templateId`
- **Dependencies**: Existing `roles` table
- **Files**: `permission_template` migration/model, `role.dao.js`, `rbac.controller.js`, `rbac.router.js`

### M2 — Backend: Defaults & Inheritance
- **Task H2.1**: Seed 4 templates: Server, Host, Manager, Admin
- **Task H2.2**: When creating a role, allow cloning from template
- **Task H2.3**: When updating a group, suggest templates
- **Dependencies**: M1 complete
- **Files**: `data/seeds/permission-templates.js`, `rbac.service.js`

### M3 — Frontend: Template Picker
- **Task H3.1**: Role create/edit modal shows "Start from template" dropdown
- **Task H3.2**: Template preview card with permission breakdown
- **Task H3.3**: Save as template from existing role
- **Dependencies**: M2 complete
- **Files**: `RoleManagementView.vue`, `GroupManagementView.vue`

### Acceptance Criteria
- [ ] Admin can create/edit/delete templates
- [ ] Role creation can clone a template
- [ ] Group creation can clone a template

---

## Feature I: Walk-In Queue Linked to Customers (S)

### M1 — Backend: Customer Linkage
- **Task I1.1**: Add `customerId` nullable to `waitlist` table
- **Task I1.2**: `POST /api/v1/waitlist` accepts optional `customerId`
- **Task I1.3**: `GET /api/v1/waitlist?customerId=...` returns customer history
- **Dependencies**: Existing `waitlist` + `customers` tables
- **Files**: `waitlist` migration, `waitlist.dao.js`, `waitlist.controller.js`, `waitlist.router.js`

### M2 — Backend: Smart Matching
- **Task I2.1**: If `customerId` present, pre-fill name/email/phone/notes
- **Task I2.2**: Return customer preferences/visit count in waitlist response
- **Dependencies**: M1 complete
- **Files**: `waitlist.service.js`

### M3 — Frontend: Quick-Add UI
- **Task I3.1**: Walk-in form has "Find existing customer" search
- **Task I3.2**: Pre-fill on select; allow override
- **Task I3.3**: Show customer visit badge before confirming
- **Dependencies**: M2 complete
- **Files**: `WaitlistView.vue`, `CustomerSearch.vue`

### Acceptance Criteria
- [ ] Walk-in can be linked to existing customer in one click
- [ ] Customer preferences surface on waitlist entry
- [ ] Guest checkout still works without customerId

---

## Feature J: Deposit / Prepayment (S)

### M1 — Backend: Deposit Schema
- **Task J1.1**: Add `depositAmount`, `depositStatus` (pending/paid/refunded) to `reservations`
- **Task J1.2**: `POST /reservations/:id/deposit` creates payment linked to reservation
- **Task J1.3**: `PATCH /reservations/:id/status` enforces deposit rules per setting
- **Dependencies**: Existing `payments` + `settings` tables
- **Files**: `reservations` migration, `reservation.dao.js`, `reservation.controller.js`, `reservation.router.js`

### M2 — Backend: Business Rules
- **Task J2.1**: Auto-require deposit for partySize > 6 or peak hours
- **Task J2.2**: Refund deposit on cancellation within policy window
- **Dependencies**: M1 complete; existing settings mechanism
- **Files**: `reservation.service.js`

### M3 — Frontend: Deposit UX
- **Task J3.1**: Reservation form shows deposit notice
- **Task J3.2**: Payment modal includes deposit line item
- **Task J3.3**: Refund button on cancelled/deposited reservations
- **Dependencies**: M2 complete
- **Files**: `NewReservationView.vue`, `ReservationCard.vue`

### Acceptance Criteria
- [ ] Deposit required for large parties when enabled
- [ ] Deposit refunded on compliant cancellation
- [ ] Non-refundable deposits tracked in payment history

---

## Feature K: Table Turn-Time Analytics (S)

### M1 — Backend: Metrics API
- **Task K1.1**: `GET /api/v1/reports/turn-time?from=...&to=...&tableIds[]=...`
- **Task K1.2**: Calculate avg/median turn time from `seatedAt` → `completedAt`
- **Task K1.3**: Revenue-per-table metric from `payments` joined to `reservations.tables`
- **Dependencies**: Existing `reservations` + `payments` + `table_staff`
- **Files**: `report.dao.js`, `report.controller.js`, `report.router.js`

### M2 — Frontend: Turn-Time Dashboard
- **Task K2.1**: `TurnTimeReport.vue` with table heatmap + histogram
- **Task K2.2**: Revenue per table bar chart
- **Dependencies**: M1 complete
- **Files**: `TurnTimeReport.vue`

### Acceptance Criteria
- [ ] Turn time report includes avg/median/target comparison
- [ ] Revenue per table drill-down by payment method
- [ ] Date range + table filter

---

## Feature L: Refund Workflow + Audit Trail (S)

### M1 — Backend: Refund Model
- **Task L1.1**: Add `refunds` table with amount, paymentId, reason, status, refundedBy
- **Task L1.2**: `POST /api/v1/payments/:id/refund` creates refund record
- **Task L1.3**: Enforce idempotency key to prevent duplicate refunds
- **Dependencies**: Existing `payments` table
- **Files**: `refund` migration/model, `payment.dao.js`, `payment.controller.js`, `payment.router.js`

### M2 — Backend: Audit Trail
- **Task L2.1**: Emit `payment:refunded` socket event
- **Task L2.2**: Create `audit_logs` entry with refund details
- **Task L2.3**: Prevent refund after settlement window (configurable)
- **Dependencies**: M1 complete
- **Files**: `payment.service.js`, `auditLog.middleware.js`

### M3 — Frontend: Refund UI
- **Task L3.1**: Refund button in `PaymentDashboardView.vue` with reason dropdown
- **Task L3.2**: Refund reason required; input captured to audit log
- **Task L3.3**: Refund history row under reservation detail
- **Dependencies**: M2 complete
- **Files**: `PaymentDashboardView.vue`, `ReservationDetail.vue`

### Acceptance Criteria
- [ ] Refund creates record + updates payment status
- [ ] Duplicate refund attempts rejected
- [ ] Full audit trail includes actor, amount, reason, timestamp

---

## Feature M: Email Reminders & Confirmations (S)

### M1 — Backend: Mail Service
- **Task M1.1**: Add `mail.service.js` using `nodemailer` (already added)
- **Task M1.2**: Templates: reservation confirmation, reminder (24h), cancellation
- **Task M1.3**: `POST /api/v1/notifications/send` with schedule/trigger control
- **Dependencies**: Existing `nodemailer` install from log-email feature
- **Files**: `mail.service.js`, `notification.controller.js`, `notification.router.js`

### M2 — Backend: Scheduling
- **Task M2.1**: Job checks every 5 minutes for reservations needing reminders
- **Task M2.2**: Resend/cancel logic respects customer preferences
- **Task M2.3**: Track sent state in `reservations.emailSentAt`
- **Dependencies**: M1 complete
- **Files**: `notification.service.js`

### M3 — Frontend: Preferences
- **Task M3.1**: Customer profile has "Email reminders" toggle
- **Task M3.2**: Reservation confirmation page shows "Check your email"
- **Dependencies**: M2 complete
- **Files**: `CustomerProfileView.vue`, `NewReservationView.vue`

### Acceptance Criteria
- [ ] Confirmation emails sent on new reservation
- [ ] Reminder emails sent 24h before reservation
- [ ] Customer can disable reminders

---

## Feature N: Real-Time Table Status Board (XS)

### M1 — Backend: Status Events
- **Task N1.1**: `table-freed` event covers most status changes; verify coverage for `seated`/`completed`
- **Task N1.2**: Emit `table-updated` on status change with full table payload
- **Dependencies**: Existing `socket.io`
- **Files**: `table.controller.js`

### M2 — Frontend: Board View
- **Task N2.1**: `TableStatusBoard.vue` at `/tables/board` — grid of table status cards
- **Task N2.2**: Color-coded by status; click opens reservation detail
- **Task N2.3**: Filter by zone/area if configured
- **Dependencies**: Existing `Table` model + socket
- **Files**: `TableStatusBoard.vue`, `router/index.js`

### Acceptance Criteria
- [ ] Board updates in real-time without refresh
- [ ] Click table card jumps to reservation
- [ ] Responsive to mobile viewports

---

## Feature O: Email Templates / Branding (XS)

### M1 — Backend: Template Store
- **Task O1.1**: Add `email_templates` table (key, subject, body, brand assets)
- **Task O1.2**: `GET/PATCH /api/v1/admin/email-templates`
- **Task O1.3**: Template variables supported: `{{customerName}}`, `{{date}}`, `{{time}}`, `{{table}}`
- **Dependencies**: SQLite or MySQL
- **Files**: `email_template` migration/model, emailTemplatesDAO, `admin.controller.js`, `admin.router.js`

### M2 — Frontend: Template Editor
- **Task O2.1**: `EmailTemplateEditor.vue` with live preview
- **Task O2.2**: Variable picker sidebar
- **Dependencies**: M1 complete
- **Files**: `EmailTemplateEditor.vue`, `AdminSettingsView.vue`

### Acceptance Criteria
- [ ] Admin can edit templates in UI
- [ ] Variables render on send
- [ ] Preview shows final rendered email

---

## Feature P: Health Check / Uptime Monitoring (XS)

### M1 — Backend: Health Route
- **Task P1.1**: Add `/api/v1/health` with DB + Redis + mail connectivity checks
- **Task P1.2**: Return `200 healthy` or `503 degraded` with component statuses
- **Dependencies**: None
- **Files**: `health.controller.js`, `health.router.js`

### M2 — Monitoring Client
- **Task P2.1**: UptimeRobot / Pingdom config snippet in README
- **Task P2.2**: Add `GET /api/v1/stats` (already exists) to health suite
- **Dependencies**: M1 complete
- **Files**: `README.md`

### Acceptance Criteria
- [ ] `/health` reflects DB/Redis/mail status
- [ ] Safe to call from external monitor every 60s

---

## Feature Q: DB Backup Scheduling + Restore (XS)

### M1 — Backend: Backup Service
- **Task Q1.1**: `backup.service.js` runs `mysqldump` to `backups/` with timestamp
- **Task Q1.2**: `POST /api/v1/admin/backup/run` triggers on-demand backup
- **Task Q1.3**: `GET /api/v1/admin/backups` lists available backups
- **Dependencies**: `mysqldump` available in environment
- **Files**: `backup.service.js`, `backup.controller.js`, `backup.router.js`

### M2 — Backend: Restore (Dry Run First)
- **Task Q2.1**: `POST /api/v1/admin/backup/restore/:filename` with confirmation token
- **Task Q2.2**: Validate backup file integrity before restore
- **Task Q2.3**: Protect with `admin` + rate limit + CSRF
- **Dependencies**: M1 complete
- **Files**: `backup.service.js`

### M3 — Frontend: Admin Tool
- **Task Q3.1**: `AdminSettingsView.vue` "Backups" card with run/download/restore actions
- **Task Q3.2**: Confirmation modal before restore
- **Dependencies**: M2 complete
- **Files**: `AdminSettingsView.vue`

### Acceptance Criteria
- [ ] On-demand backup creates dump in `backups/`
- [ ] Restore requires explicit confirmation
- [ ] Rate limited to prevent accidents

---

## Feature R: Sentry + Frontend Error Boundary (XS)

### M1 — Backend: Sentry Already Present
- **Task R1.1**: Verify `SENTRY_DSN` env var flow in `server.js`
- **Task R1.2**: Add global error handler forwarding to Sentry
- **Dependencies**: None
- **Files**: `middleware/errorHandler.js`, `utils/sentry.js`

### M2 — Frontend: Error Boundary
- **Task R2.1**: Create `ErrorBoundary.vue` catching render errors
- **Task R2.2**: Report to Sentry with route/component stack
- **Task R2.3**: Fallback UI with reload button
- **Dependencies**: Sentry JS SDK installed
- **Files**: `ErrorBoundary.vue`, `main.js`

### Acceptance Criteria
- [ ] Unhandled Vue errors report to Sentry
- [ ] User sees friendly fallback instead of blank page
- [ ] Frontend errors grouped by component

---

## Build Order Recommendation

### Phase 1 — Revenue Protection (1–2 sprints)
1. **F: Recurring Reservations** — long-tail booking value
2. **D: Split Bills** — ops pain point at checkout
3. **G: Customer Loyalty** — low cost, repeat-guest value

### Phase 2 — Ops Efficiency (1 sprint)
4. **A: Waitlist Auto-Promotion** — reuses sockets + waitlist
5. **B: Status Timeline** — audit and debugging
6. **C: Table Combining** — large-party revenue

### Phase 3 — Customer Experience (1 sprint)
7. **E: Notes & Occasions** — personalization
8. **I: Walk-In + Customer Link** — faster check-in
9. **M: Email Reminders** — no-show reduction

### Phase 4 — Analytics & Extras (1 sprint)
10. **K: Turn-Time Analytics** — insights
11. **L: Refund Audit Trail** — financial accuracy
12. **H: Permission Templates** — admin efficiency

### Phase 5 — Polish & Ops (1 sprint)
13. **N: Real-Time Status Board** — host tool
14. **O: Email Templates** — branding
15. **P/Q/R**: Health, Backups, Sentry

---

## Cross-Cutting Concerns

### Schema Safety
- Prefer nullable JSON columns over ENUMs for future extensibility
- Use raw SQL for ENUM migrations (see `20260102000003-user-permissions.js` pattern)
- Always include `down()` in new migrations

### Socket Events
- Namespace events by domain: `reservation:*`, `table:*`, `waitlist:*`
- Debounce identical payloads within 150ms (existing pattern in `App.vue`)

### Testing
- Backend: Jest for new DAO queries and service rules
- Frontend: Vitest for components/templates, Playwright for merge/flow e2e
- Each PR must include `npm run test` output

### Security
- All new write routes protected by `protect` + permission middleware
- Rate-limit heavy endpoints (`/backup/run`, `/payments/refund`) to 5/hour
- Never log raw payment amounts or customer PII

### Rollout
- Feature flags via `settings.value` JSON for email reminders and auto-promotion
- Canary enable in staging first; existing flows must not regress

---

## Files Expected to Change

| Area | Controllers | DAOs | Models/Migrations | Routes | Frontend Views | Components/Services |
|---|---|---|---|---|---|---|
| Recurring reservations | reservation.controller.js | reservation.dao.js | reservation migration | reservation.router.js | NewReservationView.vue | recurrence.service.js |
| Split bills | payment.controller.js | payment.dao.js | payment migration | payment.router.js | PaymentDashboardView.vue | payment.service.js |
| Loyalty | customer.controller.js | customer.dao.js | customer migration | customer.router.js | CustomerProfileView.vue | loyalty.service.js |
| Auto-promotion | waitlist.controller.js | waitlist.dao.js | waitlist migration | waitlist.router.js | WaitlistOfferBanner.vue | notification.service.js |
| Status timeline | reservation.controller.js | reservation.dao.js | reservation_status_history migration | reservation.router.js | ReservationTimeline.vue | — |
| Table combining | reservation.controller.js | reservation.dao.js | reservations migration | reservation.router.js | FloorPlan.vue | reservation.service.js |
| Deposit | reservation.controller.js | reservation.dao.js | reservations migration | reservation.router.js | NewReservationView.vue | reservation.service.js |
| Turn-time | report.controller.js | report.dao.js | — | report.router.js | TurnTimeReport.vue | report.service.js |
| Refunds | payment.controller.js | payment.dao.js | refunds migration | payment.router.js | PaymentDashboardView.vue | payment.service.js |
| Templates | rbac.controller.js | role.dao.js | permission_templates migration | rbac.router.js | RoleManagementView.vue | rbac.service.js |
| Email reminders | notification.controller.js | — | — | notification.router.js | NewReservationView.vue | mail.service.js |
| Status board | table.controller.js | table.dao.js | — | table.router.js | TableStatusBoard.vue | — |
| Email templates | admin.controller.js | emailTemplate.dao.js | email_templates migration | admin.router.js | AdminSettingsView.vue | mail.service.js |
| Health check | health.controller.js | — | — | health.router.js | — | — |
| Backups | backup.controller.js | — | — | backup.router.js | AdminSettingsView.vue | backup.service.js |
