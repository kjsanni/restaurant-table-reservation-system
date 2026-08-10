---
title: Improvement Recommendations — Full Audit
date: 2026-07-16
tags:
  - recommendations
  - audit
  - frontend
  - backend
  - security
  - ux
  - rbac
---

# Improvement Recommendations — Full Audit

> [!abstract] Scope
> Per-page, per-feature improvement opportunities for the Restaurant Table Reservation System, distilled from a full frontend + backend code audit. Findings are grouped by severity. Several high-severity items were verified directly against source.

> [!warning] Stack note
> The architecture docs (100-MOC) describe "PrimeVue + Tailwind", but the actual frontend uses **Vuestic UI + a hand-rolled Tailwind-lookalike CSS** (`assets/design-system.css`) and custom design tokens. Reconcile the docs with reality before any "adopt Tailwind/PrimeVue" work.

---

## 🔴 High Severity (fix first)

### Security / RBAC
- **RBAC fallback bypasses permissions** — `back-end/src/middleware/auth.js:68` sets `user.permissions = defaults[user.role] || defaults.staff`, and lines 40–60 grant `manage_tables: true` to every `staff`/`admin`. Any staff user passes `requirePermission("manage_tables")` even without a real role/group grant. **Derive permissions strictly from `roleDAO.getRolePermissions`; remove permissive role defaults.**
- **Reservation mass-assignment** — `reservation.controller.js:37` (`editHandler`) passes raw `req.body` straight into `reservation.dao.js:249 updateReservation` → `Reservation.update(resDetails)`. A client can set `resStatus`, `paymentStatus`, `expectedTotal` arbitrarily. **Whitelist editable fields** in the controller.
- **`bulkUpdate` has no field allowlist** — `reservation.dao.js:511` accepts arbitrary `updates`/`ids`; same tamper risk. Allowlist fields.
- **SMTP password round-trips in clear** — `AdminSettingsView.vue` saves and re-reads the email-server password via the settings API. Passwords should be **write-only** (never returned by GET) and the input must be `type="password"`.
- **Stored-XSS in email preview** — `EmailTemplatesView.vue:307` uses `v-html` with admin-authored HTML + an unescaped `theme.logoUrl` injected into `<img src>`. Render preview in a **sandboxed `<iframe srcdoc>`** and validate `logoUrl`.
- **Error handler leaks internals** — `errorHandler.js:26` returns `err.message` to the client; on 500s this exposes Sequelize/SQL details. Return a generic message; log the detail server-side.

### Correctness / Data
- **Schedule enforcement is dead code** — `scheduleService.checkScheduleAvailability` is **never called** from `registerReservation` (`reservationService` only calls `validateTime`). Opening/closing hours and holiday closures are **not enforced** on new reservations. Wire it in.
- **String-based time comparison** — `reservationService:30` (`resTime < currTime`) and `reservation.dao:60` (`Op.like` on dates) compare `HH:MM`/dates as **strings**. `"09:00" < "8:00"` is false; single-digit hours break ordering. Use real `Date`/`TIME` comparisons.
- **CSV formula injection** — `reportService:32` injects `${r.name}` unescaped. A customer name with `=`, `+`, `-`, `@` becomes a spreadsheet formula. **Quote/escape all CSV fields.**
- **Revenue ignores discounts** — `payment.dao:56 getRevenueStats` sums `amount` (not `amount - discount`), overstating revenue in dashboards, PDF, and CSV.
- **Calendar UTC date bug** — `CalendarView.vue:111` and several other views use `date.toISOString().split("T")[0]`, shifting the day in negative-UTC timezones. Use the existing local-date formatter (`dateNavigator.asDateString`).

---

## ⚖️ Compliance & Legal (added 2026-07-20)

The legal system is now built (see [[910-Legal-Compliance-System]] and [[911-Legal-Acceptance-Audit-Trail]]). Remaining compliance gaps:

- **Customer-deposit consent checkbox** — there is no shopfront checkout in the B2B app today, so the customer-facing **Payment & Refund Policy** / **Customer Policy** are only linked from the customer portal, not accepted at the point of payment. When a customer deposit/checkout flow is added, require an explicit acceptance (reuse the `legal_acceptances` model with a `customerId`/reservation linkage).
- **`legal_acceptances` lacks a `customerId` column** — the table only records `userId` (tenant staff). Extend it (nullable `customerId`) before wiring customer-side acceptance so the audit trail covers both controllers and data subjects.
- **Version-bump discipline** — `LEGAL_DOCUMENT_VERSIONS` exists in both backend controller and frontend service; add a test/CI check that the two maps stay in sync, and a changelog entry whenever a document's content changes (GDPR/DPA evidence).
- **Data-subject request (DSAR) handler** — the Privacy Policy promises erasure/access rights, but there is no in-app DSAR workflow for guests. Add a request intake (email → `privacy@vibespot.tech`) with an admin triage view, especially since each Tenant is an independent controller.
- **Sub-processor transparency** — the GDPR/DPA docs reference Paystack and infra providers; publish a maintained sub-processor list endpoint or page (the backend `/api/v1/legal` could expose it).

## 🟠 Medium Severity

### Frontend — Duplication & Performance
- **Calendar logic duplicated ~90%** in `CalendarView.vue` (1,413 lines) and `TheReservations.vue`. Extract a `useReservationCalendar()` composable; `TheReservations` already uses `Map` lookups while `CalendarView` still uses O(n·m) `.find()` — unify.
- **Dead/misleading view** — `AddTableView.vue` is fully disabled ("Coming Soon") yet table creation already works in `TableManagementView.registerTable`. It's not even routed. **Delete it.**
- **Dashboard over-fetches** — `HomeView.vue` makes 6 sequential/parallel round-trips; fold the two extra `getReservations` calls into the initial `Promise.all` or a single call + client filter.
- **No server pagination** — `AuditLogView` (`getAuditLogs` takes no params), `PaymentDashboardView`, `ReportView` load everything client-side. Add server-side pagination/filtering; large logs/reports will not scale.
- **Fragile DOM coupling** — `FloorPlanView.vue:119-128` drag-highlight uses `document.querySelectorAll(".table-block")[idx]` indexed by array position. Switch to reactive `dragOverTableId` + `:class`.
- **Loyalty feature is dead** — `NewReservationView.loadCustomerLoyalty` is never called (no `@blur`/`watch` on email), so the loyalty/tags section can never show. Wire it or remove it.
- **No submit guards** — `NewReservationView`, `LoginView`, `RegisterView` lack disabled/loading state → double-submit can create duplicate reservations.
- **SPA-breaking navigation** — `CustomerProfileView.vue:121` uses `window.location.href` (full reload) instead of `router.push`.
- **Unbatched loops** — `FloorPlanEditorView.autoArrange` saves positions in a sequential `for...await`; use `Promise.all` / a bulk-position endpoint. `NewReservationView` `watch(people)` calls `calculatePrice` on every keystroke without debounce.

### Backend — Validation / Robustness
- **`chooseTable` missed-status logic is buggy** — duplicated blocks and a mislabeled `twoMinsAgo` (commented as 30-min). Reservations may not be marked missed correctly.
- **`setReservationTable` ignores capacity** — no capacity-vs-party-size check; `ceil(people/capacity)` can exceed free tables; multi-table update lacks a transaction.
- **`mergeTables` link asymmetry** — sets `parentTableId` on children but never records `linkedTableIds` on the parent; no transaction around create+update.
- **Login lockout window** — `auth.dao:224 clearLoginAttempts` only deletes attempts within 15 min; a slow attacker (1 attempt/16 min) never locks out. Use a sliding window.
- **Refresh-token rotation is best-effort** — if `createRefreshToken` fails, an access token is still issued with no stored refresh token.
- **CSRF not on `/register`** — open registration should be CSRF-protected to prevent CSRF-driven staff-account creation.
- **Notifications** — `sendEmailHandler` can send arbitrary HTML (template injection risk if not sanitized); SMS handler is a silent no-op stub returning `delivered:false` misleadingly.
- **Audit log gaps** — entityType mapping misses `rbac`/`waitlist`/`payments`/`customers` (logs as `unknown`); no pagination on `getAllLogs`; confirm `view_audit_logs` is enforced.
- **Config/env validation** — `config.js` reads DB creds with no validation; missing `JWT_SECRET` only throws at request time. Add startup validation.

---

## 🟡 Low Severity / Polish

### Frontend
- **Undefined design tokens** — `--duration-normal`, `--duration-fast`, `--earth-700`, `--sky-700` are referenced but undefined (silently break transitions/colors). Define or remove them.
- **Legacy font stack** — `AboutView` and auth views use `"Inter-Bold"`/`"Inter-Light"` which don't exist; standardize on the design-system font tokens.
- **`console.error` instead of `logger`** — `HomeView`, `AdminSettingsView`, `AuditLogView`, `AddTableView`, `CalendarView` leak to prod console; use the shared logger.
- **Accessibility** — `FloorPlanEditorView`/`FloorPlanView` drag interactions have no keyboard/screen-reader alternative; `PageHeader` used without import in dead `AddTableView`; `AboutView` is placeholder content.
- **Component reuse** — `LoginView`/`RegisterView` duplicate ~200 lines of auth CSS → extract `AuthCard`/`auth.css`. Split `AdminSettingsView` (875 lines) and `CustomerProfileView` into child components.
- **`validationErrors` type mismatch** — `NewReservationView` sets an array but `ErrorMessage` expects a string; only `generalError` shows.
- **Status vocab not centralized** — `confirmed`/`pending`/`seated`/`missed`/`cancelled`/`completed` handled inconsistently across views.

### Backend
- **`auditLog.js` entityType** — add missing mappings (see Medium).
- **`sanitize.js`** — strips `<>` and `on\w+=` only; rely on output encoding instead of naive stripping.
- **CSP/CSRF in dev** — `csp.js` allows `unsafe-inline`/`unsafe-eval` and CSRF `sameSite:false` in non-prod; ensure prod tightens.
- **`/api/v1/stats` and `/health`** — no auth (minor info exposure).
- **`AboutView`, `NotFoundView`** — minor responsive/layout nits.

---

## 🧪 Testing Gaps (highest-risk paths untested)
Only `customer.profile`, `heatmap`, and `table.spec` exist. Add tests for:
- Auth lockout + RBAC permission enforcement (the bypass above)
- Reservation validation + mass-assignment rejection
- Payment/revenue math (discount handling)
- CSV/PDF export correctness + injection safety
- Table merge/unmerge + capacity logic
- `checkScheduleAvailability` enforcement

---

## Prioritized Action Plan
1. **RBAC fallback bypass** (`auth.js`) — security-critical.
2. **Reservation/PATCH bulk mass-assignment** — whitelist fields.
3. **Wire `checkScheduleAvailability`** into `registerReservation`.
4. **CSV injection + revenue discount** fixes in reports/payments.
5. **Email preview XSS sandbox** + SMTP password write-only.
6. ~~Extract `useReservationCalendar` composable~~ ✅ Done 2026-07-17.
7. ~~Server-side pagination~~ for audit log, payments, reports. ✅ Done 2026-07-17 (AuditLogView + PaymentDashboardView already paginated; ReportView shows aggregate metrics only).
8. ~~UTC date fix~~ across views. ✅ Done 2026-07-17 (no remaining `toISOString().split("T")[0]` patterns; remaining `toISOString()` calls are safe).
9. ~~Test coverage~~ for the above. ✅ Done 2026-07-17 (91 backend tests, 15 suites; added auth, webhook, feature flag, WhatsApp template tests).

---

## Resolved during continuation (2026-07-17 evening)

| # | Issue | File | Change |
|---|-------|------|--------|
| 9 | **SMS handler stub removed** | `back-end/src/services/notification.service.js` + deleted `notificationService.js` | SMS provider stub (`sendSMS`) was removed entirely; notification channels are now **email + WhatsApp only**, driven by `notification_channels` setting. `sendViaChannels` dispatches only to enabled channels. Deleted dead `notificationService.js` (camelCase) that still contained the old SMS code. |

---

## Fixes Applied (2026-07-16)

All 🔴 High-severity items + the two 🟠 Medium security items were fixed and verified (backend modules parse, 19 jest tests pass, frontend lint clean):

| # | Issue | File | Change |
|---|---|---|---|
| 1 | RBAC fallback bypass | `back-end/src/middleware/auth.js` | Replaced hardcoded role-default permissions with `roleDAO.getRolePermissions` (role+group+user grants); empty fallback → `{}` |
| 2 | Reservation mass-assignment | `back-end/src/controllers/reservation.controller.js` | Added `EDITABLE_RESERVATION_FIELDS` allowlist + `pickEditableFields`; applied to `editHandler` and `bulkUpdateHandler` |
| 3 | Schedule not enforced | `back-end/src/services/reservationService.js` | `registerReservation` now calls `scheduleService.checkScheduleAvailability` (closed days + holidays) before create |
| 4 | CSV formula injection | `back-end/src/services/reportService.js` | `exportCSV` uses `csvCell()` escaping + neutralizes `= + - @` prefixes |
| 5 | Revenue ignores discount | `back-end/src/DAOs/payment.dao.js` | `getRevenueStats` sums `amount - discount` |
| 6 | Email preview XSS | `front-end/src/views/EmailTemplatesView.vue` | `v-html` → sandboxed `<iframe sandbox="" :srcdoc>`; logo URL validated to http/https/data only |
| 7 | SMTP password leak | `back-end/src/DAOs/auth.dao.js`, `front-end/src/views/AdminSettingsView.vue` | Server-side: `getAllSettings` + `getSettingByKey` now strip `pass` from `email_server` before serialization. Client `loadSettings` also strips it (defense in depth). |
| 8 | Error handler leak | `back-end/src/middleware/errorHandler.js` | 5xx returns generic message + logs detail server-side; 4xx still returns `err.message` |

---

## Implementation Plan & Other Modules — Status (2026-07-17)

The items from `600-Implementation Plan` and other modules are already implemented in the current codebase:

| # | Feature | Status | Key Files |
|---|---------|--------|-----------|
| 1 | Reservations: status filters, date range search, bulk actions, CSV export | ✅ Implemented | `reservation.dao.js:62-70`, `TheReservations.vue:616,800`, `ReportView.vue:34-112` |
| 2 | Tables: visual editor, QR codes, real-time occupancy | ✅ Implemented | Visual editor + QR: `TableManagementView.vue:500-506,636-647`; occupancy: socket-driven live updates in `TableManagementView.vue:415-536` |
| 3 | Calendar: week/day views, drag-to-create, time-slot view | ✅ Implemented | `CalendarView.vue:222-286,359-403`, `TimeSlotGrid.vue` |
| 4 | Floor plan: canvas editor, zones, table shapes | ✅ Implemented | Canvas editor: `FloorPlanEditorView.vue`; zones: draw-and-save zone rectangles with colors/names; shapes: layout fields exist |
| 5 | Heatmap analytics | ✅ Implemented | `reservation.controller.js:276-312`, `reservation.dao.js:562-589`, `Heatmap2D.vue` |
| 6 | Waitlist system | ✅ Implemented | `waitlist.controller.js`, `waitlist.dao.js`, `WaitlistView.vue`, `WaitlistOfferBanner.vue` |
| 7 | No-show tracking | ✅ Implemented | Dedicated `NoShowView.vue` with date filtering, stats, and missed reservation list |
| 8 | Audit log gaps (pagination, entityType coverage) | ✅ Implemented | `auditLog.dao.js:36-84` pagination; `auditLog.js:35-48` 14 entity types |

**Not yet done (deferred):** Full calendar composable integration into CalendarView.vue and TheReservations.vue was completed on 2026-07-17 (`useCalendarCore.js` + `useReservationActions.js` wired into both views, ~583 lines of duplication removed). Fuller test coverage for remaining high-risk paths can continue incrementally.

---

## Resolved during continuation (2026-07-17)

Found while picking the session back up — a **broken production require** introduced during the calendar/composable + deferred-fixes work:

| # | Issue | File | Change |
|---|-------|------|--------|
| 9 | Missing `holiday.dao` module | `back-end/src/services/reservationService.js` | `registerReservation` did `require("../DAOs/holiday.dao")` — a module that does not exist (holiday methods live in `schedule.dao`). This threw `Cannot find module` on **every** reservation creation. Repointed to `schedule.dao` (where `getHolidayByDate` actually lives). |
| 10 | Schedule/capacity regression coverage | `back-end/src/__tests__/schedule-and-table.test.js` | New test file: `checkScheduleAvailability` (no schedule / closed day / closed holiday / open), and `setReservationTable` capacity enforcement (`seats N but party size is M`). Backend suite: 59 tests, 10 suites passing. |

Frontend follow-up tweak commit also reformatted multi-line expressions left by the composable extraction (TenantSwitcher, EditReservation split summary, API tenant-header guard, reservation status-count filter, no-show stats call, socket status branch, zone loader). All committed and pushed to `RTRS/main` (`29a475f`, `e39b99`).

---

## Resolved — settings hardening & refactor (2026-07-17)

| # | Issue | File(s) | Change |
|---|-------|---------|--------|
| 11 | SMTP password round-trips server-side | `back-end/src/DAOs/auth.dao.js` | `getAllSettings` / `getSettingByKey` strip `pass` from `email_server` before serialization (was only client-stripped before). |
| 12 | No startup env validation | `back-end/config/config.js` | Added `validateEnv()` — throws at boot if `DB_HOST`/`DB_NAME`/`DB_USERNAME`/`JWT_SECRET`/`PORT` missing or `JWT_SECRET` < 16 chars. |
| 13 | `console.error` leak in prod | `HomeView.vue`, `AuditLogView.vue`, `ScheduleView.vue`, `RevenueReportView.vue` | Replaced raw `console.error` with shared `logger.error` (dev-gated). |
| 14 | `AdminSettingsView.vue` ~1500 lines | `AdminSettingsView.vue` + 5 new components | Split into `CoreSettingsCard`, `EmailSettingsCard`, `IntegrationSettingsCard`, `PlatformSettingsCard`, `QuickActionsCard` under `front-end/src/components/settings/`. Shared card/field/button styles extracted to `front-end/src/assets/settings.css` (imported in `main.ts`). Parent is now a thin 259-line container. |
| 15 | Email preview XSS (re-confirmed) | `front-end/src/views/EmailTemplatesView.vue` | Already sandboxed (`<iframe sandbox="" :srcdoc>` + `isSafeImageUrl`); confirmed airtight — no change needed. |
| 16 | `/register` CSRF + broken public registration | `back-end/src/routes/auth.router.js` | Route used `writeRoute("")` which injected `protect` (JWT required) — public self-registration was 401-ing. Replaced with `authLimiter + validateCsrfToken + handler` so registration is public, CSRF-protected, and rate-limited. Frontend Axios already sends `x-xsrf-token` from the `XSRF-TOKEN` cookie. |
| 17 | Audit `entityType` gaps | `back-end/src/middleware/auditLog.js` | Added mappings for `tenant`, `notification`, `billing`, `profile`, and `auth` (login/logout/register); `staff` now maps to `staff` (was `user`). Closes the remaining 🟠 Medium audit item. |
| 18 | Duplicate "Integrations" card | `front-end/src/views/AdminSettingsView.vue` | Removed `whatsapp_config`/`notification_channels`/`paystack_config`/`tenant_mode_enabled` from `settingsConfig` (rendered as empty json placeholders by `CoreSettingsCard`) — these are fully owned by `IntegrationSettingsCard`. Eliminates the second, placeholder-only Integrations card. |

Verification: backend 64/64 jest tests pass; frontend `vue-tsc` clean + `npm run build` succeeds.

**Audit status: all 🔴 High + 🟠 Medium severity items resolved.**

---

## Settings activation (2026-07-17) — made new settings functional

The settings added in prior sessions were stored but inert. This batch wires them into the UI/backend:

| # | Setting | Change |
|---|---------|--------|
| 19 | `currency_locale` | New `utils/formatMoney.ts` + `composables/useCurrency.ts`. Applied to RevenueReportView, EditReservation, CustomerProfileView, FloorPlanView — money now formats via `Intl.NumberFormat(currency, locale)` instead of hardcoded `GHS`/`$`. |
| 20 | `branding` | New `composables/useBranding.ts`; `authStore` exposes `branding` (populated by `fetchSettings`/`fetchTenantMode`). LoginView shows logo/brand name + binds `--brand-accent`. `useTenantBranding` now falls back to global `authStore.branding` (primaryColor → `--brand-*` CSS vars) so the whole app reflects branding. Backend `emailService.getEmailTheme` merges `branding` into email theme (logo/name/color). |
| 21 | `message_templates.whatsapp_reminder` | `notification.service.buildWhatsAppText` now renders the admin-configured WhatsApp reminder template with `{{name}}`/`{{date}}`/`{{time}}`/`{{partySize}}`/`{{table}}`/`{{restaurantName}}` substitution (with default fallback). `scheduleReminders` loads the template from the setting. New test: `notification-whatsapp-template.test.js`. |

Verification: backend 67/67 jest tests pass (12 suites); frontend `vue-tsc` clean + `npm run build` succeeds.

## Night-session fixes (2026-07-17)

| # | Issue | File | Change |
|---|-------|------|--------|
| 22 | SPA-breaking navigation | `front-end/src/views/CustomerProfileView.vue` | `window.location.href` → `router.push` |
| 23 | Submit guards | `LoginView.vue`, `RegisterView.vue`, `NewReservationView.vue` | Added `submitting` ref + disabled button states |
| 24 | Loyalty dead code | `front-end/src/views/NewReservationView.vue` | Wired `loadCustomerLoyalty` to debounced watcher on `reservation.email` |
| 25 | Login lockout bypass | `back-end/src/DAOs/auth.dao.js` | Replaced fixed-window lockout with true sliding window: count attempts in last 15 min from `Date.now()`, lock if ≥5 |
| 26 | Refresh-token rotation | `back-end/src/services/authService.js` | Create new token **before** revoking old; removed try/catch swallow so rotation failures surface |
| 27 | Server-side pagination confirmed | `AuditLogView.vue`, `PaymentDashboardView.vue` | Backend already accepts `page`/`pageSize`; frontend already has pager UI. ReportView shows aggregate metrics only, no list pagination needed. |

Verification: backend 91/91 jest tests pass (15 suites); frontend `vue-tsc` clean + `npm run build` succeeds.

## Night-session fixes (2026-07-17)

| # | Issue | File | Change |
|---|-------|------|--------|
| 22 | SPA-breaking navigation | `front-end/src/views/CustomerProfileView.vue` | `window.location.href` → `router.push` |
| 23 | Submit guards | `LoginView.vue`, `RegisterView.vue`, `NewReservationView.vue` | Added `submitting` ref + disabled button states |
| 24 | Loyalty dead code | `front-end/src/views/NewReservationView.vue` | Wired `loadCustomerLoyalty` to debounced watcher on `reservation.email` |
| 25 | Login lockout bypass | `back-end/src/DAOs/auth.dao.js` | Replaced fixed-window lockout with true sliding window: count attempts in last 15 min from `Date.now()`, lock if ≥5 |
| 26 | Refresh-token rotation | `back-end/src/services/authService.js` | Create new token **before** revoking old; removed try/catch swallow so rotation failures surface |
| 27 | Status vocab centralization | `front-end/src/constants/reservationStatus.js` + `FloorPlan.vue` + `FloorPlanView.vue` | Added `CONFIRMED`; replaced hardcoded `"pending"` with `RESERVATION_STATUS.PENDING` |
| 28 | Undefined CSS tokens | `front-end/src/assets/base.css` | Added `--earth-700`, `--sky-700`, `--duration-fast`, `--duration-normal` |
| 29 | Legacy font stacks | `TableView.vue`, `AssignStaff.vue`, `FloorPlan.vue` | Replaced `"Inter-Bold"`/`"Inter-Light"` with `var(--font-sans)` + `font-weight: 700`/`300` |
| 30 | Dead SMS service | `back-end/src/services/notificationService.js` | Deleted dead camelCase file containing old SMS stub; channels are now email + WhatsApp only |
| 31 | Unused validationErrors | `front-end/src/views/NewReservationView.vue` | Removed unused `validationErrors` ref and assignments (never rendered in template) |
| 32 | POS sync module | `back-end/src/services/sync.service.js`, `sync.controller.js`, `sync.router.js` | Added opt-in BV360 POS integration: table pull, reservation push, payment settlement webhook. Both products remain standalone; sync is gated by `pos_sync` setting. |
| 33 | Rate-limit tuning | `back-end/src/middleware/rateLimit.js`, `routes/reservation.router.js`, `routes/sync.router.js` | Added `generalLimiter` to public reservation registration and POS sync endpoints. |
| 34 | CSRF coverage verified | `back-end/src/routes/*.js` | All write routes use `writeRoute` helper which injects `validateCsrfToken`. Coverage verified across 14 route files. |
| 35 | Frontend QA setup | `front-end/playwright.config.ts`, `tests/accessibility.spec.ts`, `tests/visual.spec.ts` | Added Playwright visual regression tests (Desktop/Tablet/Mobile) and axe-core accessibility audits for 5 key routes. |
| 36 | Performance - code-splitting | `front-end/vite.config.js` | Added `manualChunks` for `vuestic-ui`; future chart libs chunked separately. |
| 37 | Deploy - Podman + CI/CD | `back-end/Dockerfile`, `front-end/Dockerfile`, `podman-compose.yml`, `.github/workflows/ci.yml` | Multi-stage Podman builds for backend/frontend; compose defines MySQL, Redis, backend, frontend; CI runs tests + CodeQL. |
| 38 | Advanced reporting | `back-end/src/services/reportService.js`, `report.controller.js`, `report.router.js` | Added time-series, customer analytics, table utilization, no-show analytics endpoints. |
| 39 | Customer portal | `back-end/src/controllers/customer-portal.controller.js`, `routes/customer-portal.router.js`, `front-end/src/views/customer/*` | Self-service profile, reservations, cancellation for customers. |
| 40 | Tutorial | `904-Full-Tutorial.md` | Full tutorial for super admin, managers, staff, and customers. |

### Security Hardening & Tenant Platform (2026-07-18)

| # | Issue | File | Change |
|---|-------|------|--------|
| 41 | POS sync API key validation | `back-end/src/controllers/sync.controller.js` | `validateSyncApiKey` compares `x-api-key` against tenant's stored `posApiKey` using `crypto.timingSafeEqual` |
| 42 | Webhook fail-closed | `back-end/src/tenant-platform/services/paystack.service.js` | `verifyWebhookSignature` returns `false` when webhook secret is unset |
| 43 | Webhook signature await bug | `back-end/src/tenant-platform/controllers/billing.controller.js` | `await verifyWebhookSignature(rawBody, signature)` — async check was previously skipped |
| 44 | Admin seeder password | `back-end/src/db/seeders/20260101000000-initial-settings-and-admin.js` | Removed hardcoded `admin123`; uses `ADMIN_INITIAL_PASSWORD` env or generates random password |
| 45 | Cookie secure/sameSite | `back-end/src/middleware/csrf.js` | Drives flags from `NODE_ENV === "production"` instead of `req.secure` |
| 46 | CSRF on browser routes | `back-end/src/utils/server.js` | `validateCsrfToken` mounted on all state-changing routes; excluded server-to-server routes |
| 47 | HSTS in production | `back-end/src/utils/server.js` | `helmet` enables HSTS (`maxAge: 31536000`, `includeSubDomains`, `preload`) |
| 48 | Production env validation | `back-end/config/config.js` | Requires `FRONTEND_URL`, `API_URL`, `CORS_ORIGINS` in production |
| 49 | Tenant admin XSRF | `front-end/src/services/tenantAdminAPI.js` | Axios client sends `x-xsrf-token` + `withCredentials: true` |
| 50 | BullMQ tenant suspension | `back-end/src/queues/notification.queue.js`, `report.queue.js` | Workers skip jobs for suspended tenants |
| 51 | Platform admin permission | `back-end/src/db/seeders/20260627000000-default-roles.js` + migration `20260718000005` | `manage_tenants` granted to admin role |
| 52 | Webhook idempotency tests | `back-end/src/__tests__/billing-webhook.test.js` | Tests for 401 on bad signature, duplicate event skip, new event processing |
| 53 | MRR normalization tests | `back-end/src/__tests__/tenantSubscription.test.js` | Tests for plan-to-price normalization and zero-MRR fallback |
| 54 | tenantId NULL backfill | `back-end/src/db/migrations/20260718000004/006/007` | Partitioning rejected (FULLTEXT + SET NULL FK); migrations now backfill NULL tenantId → default tenant (id=1), keep nullable, `db:migrate` green |

Verification: backend 126/126 jest tests pass (22 suites); frontend `vue-tsc` clean + `npm run build` succeeds.

## Related
- `[[100-MOC-Architecture-Overview]]`
- `[[916-Endgame]]` — Final lap to 100% production-ready SaaS readiness tracker
- `[[501-Security-Fixes]]`
- `[[502-Bug-Fixes]]`
- `[[504-RBAC-System]]`
- `[[505-Payment-System]]`
- `[[901-Kilo-Sessions-Archive]]`

---

## Support System Integration — osTicket Patterns + Chatwoot Live Chat

> [!abstract] Scope
> The current support stack (`supportTicket` + `supportConversation` + `supportMessage`) is functional but lacks the depth expected from a production SaaS helpdesk. This section recommends adopting **osTicket's proven patterns** for ticket lifecycle management and **Chatwoot** for real-time live chat, while keeping our existing tables as the source of truth.

### Current State Audit

| Area | Status | Gap |
|------|--------|-----|
| Ticket CRUD | ✅ Basic | No replies, attachments, SLA automation, or email piping |
| Live chat | ✅ Basic | No real-time typing, inbox routing, teams/labels, CSAT workflow, multi-channel |
| Knowledge base | ❌ Missing | No self-service articles |
| Canned responses | ⚠️ Partial | `supportTemplate` exists in `setting` table but not wired into reply flow |
| Email integration | ❌ Missing | No inbound email → ticket creation |
| User portal | ❌ Missing | Tenants cannot view their own ticket history |
| Visibility permissions | ❌ Missing | No private/internal notes on tickets |

### Recommendation 1: Adopt osTicket Patterns (In-Process)

**Do NOT deploy osTicket as a separate service per tenant.** For a multi-tenant SaaS this is operationally heavy (per-tenant DBs, auth, upgrades). Instead, **import osTicket's proven patterns into our existing `supportTicket` system**:

1. **Email Piping** — Configure a platform support email (e.g. `support@yourplatform.com`). Inbound emails create tickets automatically via IMAP/POP3 polling or piping. Use our existing `emailService` + a new `emailProcessor` that:
   - Parses inbound emails
   - Creates `supportTicket` with `source: "email"`
   - Links the email thread to the ticket
   - Replies from the ticket update the email thread

2. **Ticket Replies** — Add a `supportTicketReply` model so agents/tenants can have threaded conversations within a ticket, not just a single `message` field.

3. **Attachments** — Add `supportTicketAttachment` model with S3/local storage. osTicket supports attachments on both tickets and replies.

4. **Knowledge Base** — Add a `knowledgeBaseArticle` model scoped by `tenantId` (and platform-wide articles). osTicket's KB is category + article with usefulness voting.

5. **Canned Responses** — Wire existing `supportTemplate` (stored in `setting` table) into the ticket reply flow as one-click templates.

6. **SLA & Escalation** — Add an `slaPlan` per tenant with:
   - Response time thresholds by priority
   - Automated status escalation (`open` → `overdue`)
   - BullMQ job to check SLA deadlines and notify agents

7. **User Portal** — Add a tenant-facing "My Tickets" page so venues can view their ticket history without logging into admin.

8. **Visibility Permissions** — Add `private` notes on tickets visible only to agents.

> [!note] osTicket HTTP API
> osTicket's API is limited to ticket creation only. We would only use it if a tenant wants to create tickets from their own external system — our internal API already covers that, so osTicket's API adds little value.

### Recommendation 2: Chatwoot for Live Chat (Self-Hosted, Single Instance)

**Chatwoot is the right tool for live chat**, but deploy it as **one shared self-hosted instance** with per-tenant inboxes, NOT per-tenant Chatwoot instances.

#### Architecture

```
Chatwoot (self-hosted, single instance)
├── Account: Platform
│   ├── Inbox: Tenant A (website widget + email)
│   ├── Inbox: Tenant B
│   ├── Inbox: Platform Support (super-admin)
│   └── Team: Super Admin Agents
```

#### What Chatwoot gives us out of the box

- **Website live chat widget** — embeddable per-tenant with custom branding
- **Real-time messaging** — WebSocket-based, with typing indicators
- **Multi-channel** — Email, WhatsApp, Facebook, Instagram in one inbox
- **Agent bots** — automate first responses
- **Labels, teams, assignments** — built-in routing
- **CSAT surveys** — post-conversation ratings
- **Reports** — first response time, resolution time, agent metrics
- **API-first** — full REST API for creating conversations, contacts, messages, labels
- **Webhooks** — real-time events for our platform to consume

#### Integration Points

1. **Widget per tenant** — Each tenant gets a branded Chatwoot widget on their customer portal/reservation pages. Configure via Chatwoot's `inbox` API.
2. **Tenant inbox creation** — When a tenant signs up, our backend calls Chatwoot API to create a new inbox under the platform account, tagged with `tenantId`.
3. **Conversation sync** — Use Chatwoot webhooks to mirror conversations into our `supportConversation` + `supportMessage` tables so tenants can view chat history in our admin panel.
4. **Agent routing** — Super-admin agents manage all inboxes from Chatwoot's agent panel. Tenant-specific agents only see their inbox.
5. **SSO** — Chatwoot supports OAuth2. Our super-admin and tenant-admins log into Chatwoot via our platform auth.

#### What to Keep Internal

- **Support tickets** — keep our enhanced `supportTicket` system as the source of truth. Sync selected ticket data to Chatwoot if needed, but don't replace our system.
- **Support chat admin panel** — keep our `SupportTicketsView`, `SupportChatView`, etc. as the unified admin experience. Chatwoot handles the real-time layer, we handle the data layer.

### Implementation Plan

| Phase | Work | Est. Effort |
|-------|------|-------------|
| 1 | Self-host Chatwoot (Docker), create platform account, configure 1 test inbox | 1-2 days |
| 2 | Add Chatwoot inbox provisioning API (create inbox per tenant on signup) | 2-3 days |
| 3 | Embed Chatwoot widget in tenant customer portal | 1-2 days |
| 4 | Add Chatwoot webhook handler to sync conversations → our DB | 2-3 days |
| 5 | Enhance `supportTicket` with replies, attachments, SLA, email piping | 1 week |
| 6 | Add knowledge base + canned response wiring | 3-4 days |
| 7 | Add tenant-facing "My Tickets" portal page | 2-3 days |

> [!tip] Sequencing
> The Chatwoot piece can ship independently of the ticket enhancements. Start with Phase 1-3 to get live chat working, then iterate on tickets.

### References

- osTicket docs: https://docs.osticket.com/en/latest/index.html
- osTicket API: https://docs.osticket.com/en/latest/Developer%20Documentation/API%20Docs.html
- Chatwoot self-hosted: https://developers.chatwoot.com/self-hosted
- Chatwoot API reference: https://developers.chatwoot.com/llms.txt

---

## Super-Admin Role Splitting & Privileged Account Fraud Detection

> [!abstract] Scope
> The current super-admin portal uses a single `isSuperAdmin` boolean flag, granting all 177 platform features to any account with that bit set. This section proposes functional platform roles, granular permissions, and role-aware fraud detection for privileged accounts.

### Current State

| Layer | Access Control | Granularity |
|-------|---------------|-------------|
| **Tenant** | `admin` / `manager` / `staff` roles with granular permissions | Fine-grained per tenant |
| **Platform** | Single `isSuperAdmin` boolean flag on `users` table | Coarse — all-or-nothing |

**Problem:** One compromised super-admin account = full platform compromise. No separation between:
- Platform support agent (needs ticket access only)
- Platform operations manager (needs tenant + financial access)
- Super-admin (needs full platform control)

### Proposed Functional Platform Roles

| Platform Role | Functional Area | Key Permissions | Typical User | Fraud Risk |
|---------------|-----------------|-----------------|--------------|------------|
| `platform_owner` | Full platform | All permissions | Founder / co-founder | Critical |
| `platform_operations` | Tenant lifecycle, bulk ops, feature flags, impersonation | `manage_tenants`, `bulk_operations`, `feature_flags`, `impersonation` | Operations manager | High |
| `platform_finance` | Payments, revenue, invoices, refunds, billing emails | `view_financials`, `manage_payments`, `manage_invoices`, `billing_emails` | Finance analyst | Medium |
| `platform_security` | Incident response, sessions, password policy, IP allowlist, audit logs | `incident_response`, `session_management`, `security_settings`, `view_audit_logs` | Security engineer | High |
| `platform_support` | Tickets, live chat, CSAT, templates, announcements | `support_agent`, `manage_tickets`, `manage_templates`, `announcements` | Support agent | Medium |
| `platform_compliance` | DSAR, legal acceptances, data retention, sub-processors, compliance scorecard | `manage_dsar`, `legal_acceptances`, `data_retention`, `compliance_reports` | Compliance officer | Medium |

### Feature-to-Role Mapping

| Feature Group | Operations | Finance | Security | Support | Compliance |
|---------------|------------|---------|----------|---------|------------|
| Platform overview | ✅ read | ✅ read | ✅ read | ✅ read | ✅ read |
| Tenant management | ✅ read/write | ❌ | ❌ | ❌ | ❌ |
| Bulk operations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Financial management | ❌ | ✅ read/write | ❌ | ❌ | ❌ |
| Audit logs | ❌ | ❌ | ✅ read | ❌ | ✅ read |
| Incident response | ❌ | ❌ | ✅ | ❌ | ❌ |
| Support tickets/chat | ❌ | ❌ | ❌ | ✅ read/write | ❌ |
| DSAR / legal | ❌ | ❌ | ❌ | ❌ | ✅ read/write |
| Feature flags | ✅ | ❌ | ❌ | ❌ | ❌ |
| Integration health | ❌ | ✅ read | ❌ | ❌ | ❌ |
| Paystack keys | ❌ | ✅ | ❌ | ❌ | ❌ |
| Staff integrity/fraud | ❌ | ❌ | ✅ read | ❌ | ❌ |

### Role-Aware Fraud Detection Signals

#### Super Admin (`platform_owner`)
- Role changes without 2FA
- Bulk tenant exports (>50 tenants in 1 session)
- Mass notification sends (>100 recipients)
- Settings changes outside maintenance window
- **Action:** Require hardware key or second super-admin approval for tenant suspension/deletion; all actions logged to immutable `super_admin_audit` table

#### Platform Operations (`platform_operations`)
- Bulk status changes across >5 tenants
- Financial report exports during off-hours
- Incident response actions without ticket linkage
- **Action:** Rate-limit tenant mutations (max 10/hr); require ticket linkage for incident response

#### Platform Finance (`platform_finance`)
- Refund volume >3σ above tenant average
- Payment voids during off-hours
- Bulk invoice generation without approval
- **Action:** All refunds/voids require secondary approval above configurable threshold; export to external systems blocked

#### Platform Security (`platform_security`)
- Session revocations in bulk (>10 in 5 min)
- IP allowlist changes without approval
- Audit log exports >1000 rows
- **Action:** All security mutations require super_admin co-approval; immutable append-only log

#### Platform Support (`platform_support`)
- Ticket replies with external links
- Bulk ticket closure (>20 in 1 hour)
- Viewing tickets from >3 tenants in 1 hour
- PII exposure in ticket views
- **Action:** Strip PII from ticket views unless explicitly required; block ticket deletion; all replies require template selection

#### Platform Compliance (`platform_compliance`)
- Bulk DSAR closure without documentation
- Data retention policy changes
- Sub-processor registry modifications
- **Action:** All compliance actions logged to immutable `compliance_audit` table; changes require super_admin approval

### Implementation Plan

| Phase | Work | Effort |
|-------|------|--------|
| 1 | Add `platformRole` enum to `users` table | 1 day |
| 2 | Add platform-level permissions table + seed default permission sets per role | 2 days |
| 3 | Update `requireSuperAdmin` middleware → `requirePlatformRole(...)` / `requirePlatformPermission(...)` | 1 day |
| 4 | Update all `/api/v1/admin/*` route files to use granular permissions instead of `requireSuperAdmin` | 2-3 days |
| 5 | Update super-admin sidebar to show/hide items per platform role | 1 day |
| 6 | Add role management UI (assign platform roles to users) | 2 days |
| 7 | Migrate existing `isSuperAdmin = true` accounts → `platformRole = 'platform_owner'` | 1 day |
| 8 | Add immutable `super_admin_audit` table with append-only entries + webhook notifications | 2 days |

### Immediate Wins (No Code Changes Required)

Even before implementing the full role split, extend existing `platform_audit_logs` monitoring:

1. **Super-admin action frequency** — alert when any super-admin performs >20 mutations in 1 hour
2. **Cross-tenant access pattern** — alert when a super-admin accesses >5 different tenants in 1 session
3. **Off-hours super-admin activity** — alert when `isSuperAdmin` users act between 11pm–5am GMT
4. **Support ticket PII exposure** — alert when support chat views contain >3 customer PII fields without corresponding ticket
5. **Bulk export anomaly** — alert when staff exports >100 customer records in a single session

### When You Actually Need This

| Team Size | Indicator |
|-----------|-----------|
| 1-2 people | Single super-admin is fine |
| 3-5 people | Support agents need ticket access without tenant management |
| 5+ people | Finance, security, compliance need separated access |
| Regulated environment | Audit requirements demand least-privilege proof |
| SOC 2 / ISO 27001 | Separation of duties is a control requirement |

### Recommendation

**Don't build it now** if you're still a small team. But **design for it now**:

1. **Today**: Replace `requireSuperAdmin` with `requirePermission("manage_tenants")` or a new platform-level permission on routes that don't truly need full super-admin access (e.g., support tickets, analytics, health checks)
2. **Next month**: When you hire a support agent or finance person, implement the `platformRole` enum + permission sets
3. **Never**: Don't let `isSuperAdmin` remain the only gate forever — it becomes a compliance blocker for SOC 2, ISO 27001, and Ghana DPA 2012 audits

The cheapest time to add this is when you're adding the first non-owner super-admin account. At that point, the role split pays for itself in one audit.
