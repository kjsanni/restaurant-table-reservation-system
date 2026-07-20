# Session Changelog — Frontend & Backend UI Modernization

## Overview

This session modernized the restaurant table reservation system frontend to match a consistent design system (Inter font family, rounded cards, soft shadows, improved spacing, status chips, and spinner loading states). A backend bug preventing staff–table association lookups was also fixed.

### Completed Work (2026-07-01)

- Installed TypeScript ESLint parser for Vue component linting
- Fixed TableView.vue unsafe finally block (return before finally)
- Added table `price` field with DECIMAL(10,2) and validation
- Added payment `discount` field with DECIMAL(10,2) and validation
- Added table `parentTableId` for merged table hierarchy
- Created LoadingSpinner.vue, ErrorBanner.vue, PageHeader.vue components
- Verified all migrations with sequelize-cli

---

## Frontend Changes

### 1. TypeScript Deprecation Warning Fix
**File:** `front-end/jsconfig.json`
**Change:** Added `"ignoreDeprecations": "6.0"` to `compilerOptions`
**Reason:** `baseUrl` was showing deprecation warning that will become a hard error in TypeScript 7.0.

---

### 2. Admin Settings Page
**File:** `front-end/src/views/AdminSettingsView.vue`
**Before:** Basic toggle list rendering raw values; no save feedback.
**After:**
- Settings grouped by category (`Registration`, `Reservations`) into card sections
- Boolean settings use styled `ToggleSwitch` component
- Number settings use stepper input (− / +) with min/max/step limits and unit display
- Per-setting save status (Saving… / Saved) with auto-clear
- Quick Actions updated to an icon-card grid referencing `/staff/manage`, `/roles/manage`, `/groups/manage`, `/tables/manage`, `/audit-logs`, `/schedule`, `/heatmap`, `/admin/payments`

---

### 3. Floor Plan
**File:** `front-end/src/views/FloorPlanView.vue`
**Before:** Table grid sometimes stacked vertically; sidebar and plan compete for space; plain dashed borders.
**After:**
- Enforced side-by-side layout (`flex-direction: row`) with fixed-width sidebar and flex plan panel
- Sidebar renamed to `pending-card` list with avatar initials, meta lines, drag hint, and badge count
- Plan section uses `plan-grid` with consistent card sizing and rounded corners
- Legend converted to pill badges
- Soft shadows and hover transitions throughout
- Spinner added for loading state
- Safe vertical stack below `860px`; horizontal above

---

### 4. Calendar
**File:** `front-end/src/views/CalendarView.vue`
**Before:** Plain grid cells; generic popup states; hardcoded action buttons.
**After:**
- Month nav buttons restyled as rounded icon buttons with hover fill
- Day cells use softer borders, colored closed/holiday/hour badges
- Hover lift effect on clickable days
- Popup empty/closed states use icons + centered text blocks
- Action panel uses unified card styling with bold status colors
- Reserved names on tooltip text

---

### 5. Schedule
**File:** `front-end/src/views/ScheduleView.vue`
**Before:** Plain list rows; inline holiday text; export buttons at top.
**After:**
- Split into two section cards: **Weekly Hours** and **Holidays**
- Day rows become list items with slot badge and toggle switch
- Holidays section has header with **Add Holiday** action button
- Time inputs have focus rings and disabled states
- Export buttons grouped in an action bar above the cards
- Spinner loading state added

---

### 6. Table Management
**File:** `front-end/src/views/TableManagementView.vue`
**Before:** Flat bordered list; no staff assignment UI; only block/unblock.
**After:**
- Table cards in responsive grid (`260px` min) with left status border (green/red/gray)
- Card hover lift + soft shadow
- Header shows name + status chip + table ID
- Block button kept on all cards; **Assign Staff** button hidden when staff already assigned
- Assigned staff shown as removable chips with `×` unassign button
- Block/Unblock modal uses rounded card with textarea focus ring
- **Staff assignment modal** supports:
  - Listing available staff (not already assigned AND under 5-table limit)
  - Showing each staff member's current table count (`X/5`)
  - Unassign mode showing currently assigned staff with click-to-remove
- Added `table.users` lowercase fix for Sequelize association mapping

**New API usage:** `tableAPI.getWaitingStaff()`, `tableAPI.assignStaff()`, `tableAPI.unassignStaff()`

---

### 7. Payment Dashboard
**File:** `front-end/src/views/PaymentDashboardView.vue`
**Before:** Crisp header cards; plain select filters.
**After:**
- Summary cards restyled with icon content and subtle left indicator
- Bar chart uses rounded tracks with hover transitions
- Filter selects have focus rings
- Cards grouped inside a single dashboard container with consistent gaps

---

### 8. Audit Logs
**File:** `front-end/src/views/AuditLogView.vue`
**Before:** Plain bordered table with colored header.
**After:**
- Table wrapped in a white card with soft shadow
- `entityType` shown as a blue pill badge instead of raw text
- Striped rows replaced by hover highlight
- Empty state message added
- Spinner loading state

---

### 9. Role Management
**File:** `front-end/src/views/RoleManagementView.vue`
**Before:** Border-row layout; inline delete btn.
**After:**
- Card layout per role with header containing name, system badge, and action buttons
- Permissions displayed as capital pill badges (green = active)
- Modal uses `Inter-Bold` title, grouped inputs, and modern buttons
- Empty state message

---

### 10. Group Management
**File:** `front-end/src/views/GroupManagementView.vue`
**Before:** Border-row layout; member chips inline.
**After:**
- Group cards with separated header and meta sections
- Permissions as capital pill grid
- Members as removable chips with `×`
- Two modals: Create/Edit Group and Add User to Group
- Empty state message

---

### 11. Staff Management
**File:** `front-end/src/views/StaffManagementView.vue`
**Before:** Grid list block; no image/visual identity.
**After:**
- Staff cards in 2-column grid (see `breakpoint 640px`)
- Avatar initials with gradient background on each card header
- Checkbox permission grid with `accent-color` primary blue
- Modal with `Inter-Bold` title, focus-ring inputs, and bottom action bar
- Remove button styled as danger soft variant

---

### 12. Heatmap
**File:** `front-end/src/views/HeatmapView.vue`
**Before:** Raw grid with colored cells; simple legend.
**After:**
- Spinner loading state
- Cells are rounded with hover scale + blue border ring
- Count label shown inside cell when > 0
- Tooltip text on hover
- Legend displays actual count numbers inside color swatches
- Added defensive `Array.isArray` fallback for heatmap API response to prevent `heatmapData.find is not a function` crash

---

### 13. Reports & Export
**File:** `front-end/src/views/ReportView.vue`
**Before:** Inline filters; bordered metric cards.
**After:**
- Filters grouped in a labeled card with 2×2 grid on desktop
- Generate button with disabled state when loading
- Error state styled with icon and warning background
- Metrics use icon + metric pair cards (revenue gets green left border)
- Payment breakdown rendered as a clean list table with muted count badges

---

### 14. Waitlist
**File:** `front-end/src/views/WaitlistView.vue`
**Before:** Stat cards row at top; action buttons below; stacked layout.
**After:**
- Stats shown as 2×2 pill cards with icons and left accent borders on mobile, 4-up on desktop
- Actions grouped in an action bar
- Entries use card grid with guest avatar, name, party badge, info lines, and action footer
- Empty state with envelope icon
- Popup internally upgraded with modern `field-input` styling, focus rings, and consistent button palette

---

### 15. New Reservation
**File:** `front-end/src/views/NewReservationView.vue`
**Before:** Direct `<TextBox>` usage centered in bordered wrapper; generic button width.
**After:**
- Converted to native inputs with `Inter` styling and focus rings
- Fields grouped into **Guest Details** and **Reservation Details** cards
- Tags rendered as chips: active state fills with the tag's color, inactive shows hollow border
- Submit button uses primary blue with icon, hover lift, and shadow glow
- Reduced unnecessary wrapper centering constraints

---

### 16. Reservations
**Files:** `front-end/src/views/ReservationsView.vue`, `front-end/src/components/TheReservations.vue`
**Before:** Giant arrow navigation centered; stacked reservation + table panels.
**After:**
- Navigation replaced with small rounded icon buttons + **Today** button
- Layout split into side-by-side `section-card`s on desktop (`grid-template-columns: 1fr 1fr`)
- Reservation table and all-tables grid each live in their own card containers
- Intersection observer left intact for existing blur animation

---

### 17. Search
**File:** `front-end/src/views/SearchView.vue`, `front-end/src/components/TheSearch.vue`
**Before:** Raw search input in header; `Suspense` with `SearchSkeleton`; `ListContainer` passed both bound props.
**After:**
- Header holds title + modern search bar with search icon, dark focus ring, and clear (`×`) button when text exists
- Spinner loading state replaces skeleton pattern
- Results count badge shown above list
- Empty state with magnifying-glass icon
- Consistent page padding and typography

---

## Backend Changes

### 1. Sequelize Association Fix — User ↔ Table
**File:** `back-end/src/db/models/user.js`
**Change:** Added missing reverse association to `Table`:
```js
User.belongsToMany(models.table, {
  through: "table_staff",
  foreignKey: "userId",
  otherKey: "tableId",
});
```
**Reason:** Sequelize only generates `user.getTables()` when both `Table` and `User` declare `belongsToMany`. Without this, `tableDAO.assignStaffToTable()` threw `user.getTables is not a function` when checking 5-table limit per staff member.

---

## Design System Consistency Applied

Across all modernized pages:

- **Typography:** `Inter-Bold` headings, `Inter-Medium` labels, `Inter-Light` body text
- **Surface colors:** white cards on `light-pink` background; `#f0f0f0` borders; subtle box shadows
- **Status colors:**
  - `#22c55e` green (success, free)
  - `#ef4444` red (danger, occupied, blocked)
  - `#f59e0b` amber (warning, waiting)
  - `#3b82f6` blue (primary, info)
  - `#6c757d` gray (neutral, blocked)
- **Border radius:** `8px` buttons, `10px` cards, `12px` containers, `14px` modals
- **Inputs:** `8px`/`12px` radius, `#f0f0f0` border, `#3b82f6` focus ring with `rgba(59,130,246,0.15)` shadow
- **Loading:** Centralized spinner animation (`0.8s linear infinite`) in `#lighter-gray` ring with `#primary-blue` top
- **Modals:** Fixed overlay, white `<div>` card, `14px` radius, `24px` padding, `0.5` black overlay
- **Buttons:** `btn-primary` (blue), `btn-secondary` (light gray), `btn-danger` (soft red), `btn-outline` (transparent)

---

## New API Calls Introduced

| Feature | Methods |
|---------|---------|
| Staff count per table | `GET /tables/staff` |
| Assign staff to table | `POST /tables/:id/staff` |
| Unassign staff from table | `DELETE /tables/:id/staff/:userId` |
| Payment revenue time-series | `GET /payments/revenue/time-series` |
| Heatmap v2 | `GET /reservations/heatmap-v2` |
| Waitlist suggestion | `GET /waitlist/suggest/:tableId` |
| Auto-seat from waitlist | `POST /waitlist/:entryId/seat` |

---

## Fixes Applied (Current Session)

### 1. Removed Stale Documentation
- Removed `yaml-js.js` reference from SESSION_NOTES.md and docs/900-Session-Summary.md (no such file exists in codebase)

### 2. TableView.vue Design System Upgrade
- Converted legacy table-row component to card-based layout
- Added reservation cards with avatar, status chips, payment badges
- Maintained all existing functionality (edit, cancel, seat, assign staff)
- Updated PaymentDashboardView.vue to handle new card-based TableView emit format
- Added delete confirmation modal support

### 3. Production Socket.io WebSocket Fix
**Problem:** `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED` + HTTP 400 on `/socket.io/`
**Root causes (3x):**
1. `apache-production.conf` used `RewriteRule` placed AFTER `ProxyPass /`, so catch-all frontend proxy intercepted `/socket.io/` requests before the rewrite rule
2. The active production config (`/etc/apache2/sites-available/nguni.conf`) had a broken `ProxyPass /socket.io/ ws://127.0.0.1:8000/socket.io/$1` where `$1` was literal, not a regex capture
3. Backend ran in PM2 **cluster mode** (`-i max` = 4 workers), causing Engine.IO sessions to be unknown when requests hit different workers → `{"code":1,"message":"Session ID unknown"}`
4. Dotenv loaded `.env` first with empty `CORS_ORIGINS=`, then `.env.production` with `override: false`, so origin never updated

**Fixes:**
- **`apache-production.conf`:** Replaced broken rewrite-based proxy with `ProxyPassMatch "^/socket.io/(.*)" ws://127.0.0.1:8000/socket.io/$1` placed BEFORE `ProxyPass /`
- **`deploy-prod.sh` + `ecosystem.config.js`:** Changed `instances: 'max'` → `instances: 1` (single instance required for Socket.io sticky sessions without Redis adapter)
- **`back-end/config/config.js`:** Changed `override: false` → `override: true` so `.env.production` properly overrides `.env`
- **`back-end/.env.production`:** Updated `CORS_ORIGINS` to `http://192.168.88.10`
- **Production server `/etc/apache2/sites-available/nguni.conf`:** Deployed correct `ProxyPassMatch` via SSH
- **Production PM2:** Restarted `nguni-backend` in single-instance mode (`-i 1`)

**Verification:**
- `curl http://192.168.88.10/socket.io/?EIO=4&transport=polling` → HTTP 200, body: `0{"sid":"...","upgrades":["websocket"],...}`
- Backend logs: `Client connected: J-EjU10zkHJUonsNAAAB`

### 4. Production Table Link Bug (RBAC Permissions)
**Problem:** Clicking "Tables" in sidebar navigated to `/tables/manage/` but showed nothing. Permission guard blocked the route.
**Root cause:** `back-end/src/DAOs/role.dao.js` returned permissions stored as JSON strings (from seeders using `JSON.stringify`) without parsing. `Object.assign(mergedPermissions, role.permissions)` on a string created a mangled object with numeric keys (`"0":"{","1":"\"",...`). The RBAC check saw keys existed and accepted it as valid, but `permissions["manage_tables"]` was `undefined`.

**Fix:**
- Added `normalizePermissions()` helper in `role.dao.js` that parses stringified JSON before using it
- Applied `normalizePermissions()` in `findAllRoles()`, `findRoleById()`, `findRoleByName()`, and `getRolePermissions()`
- Deployed fixed file to production via SSH
- Verified `GET /api/v1/auth/me` returns proper permissions object

**Verification:**
- `GET /api/v1/auth/me → 200`
- `permissions: {"view_reservations":true,"edit_reservations":true,"manage_tables":true,...}`
- Navigation to `/tables/manage` succeeds via browser

---

## Known Remaining Issues (not introduced this session)

- `Suspense is an experimental feature` — Vue runtime warning (no functional impact)
- `Booking a table is only available on the reservation date!` — backend business rule enforced during floor-plan drag-and-drop
- Duplicate `console.log` in `TheReservations.vue` (existing debug output)
- `TableView.vue` is the only remaining table-row component in a card-based UI (now converted to cards)

---

## 2026-07-19 Session — Admin Fixes, Staff Seeding & UI Theme Unification

### Backend Fixes
- **Admin login** — Fixed `Invalid credentials!` by resetting admin (id=25) password. Root cause: seeder generated random password when `ADMIN_INITIAL_PASSWORD` env var was unset. Set env var for deterministic seeds.
- **Business hours setting** — Added `"business_hours"` to `updateSettingsHandler` allowedKeys in `auth.controller.js`; fixes 400 on `PUT /api/v1/auth/settings` from ScheduleView.
- **Staff seeding** — Created staff users `alice`, `bob`, `carol` and seeded 5 `table_staff` assignments (tables 1, 2, 3, 20) so the floor-plan Server Overlay is functional.

### UI/UX Theme Unification
- **Shared palette** — Added `front-end/src/theme/colors.js` centralizing brand/earth/sky/rose/neutral/accent color tokens for JS contexts.
- **Normalized 30+ files** — Converted hardcoded Tailwind/Bootstrap/foreign hex values to brand CSS custom properties or brand-aligned literals across all views and components in both single-tenant and multi-tenant modes.
- **Status colors** — Updated `reservationDisplay.js` to use brand palette.
- **Tenant branding** — Existing `useTenantBranding.js` composable continues to override CSS vars for multi-tenant; unified token usage ensures consistency across both modes.

### Verification
- Frontend: `npm run build` succeeds
- Backend: tests pass
- Git: committed as `76d194c` and pushed to `RTRS` remote (main)


### Platform Admin — Tenant Management, Pricing & Payments
- **Enhanced tenant dashboard** — `TenantDashboardView.vue` now shows active/inactive summary cards, MRR, quick-action links to Tenants/Pricing/Payments, and "Access Tenant" buttons that switch context via `TenantSwitcher`
- **Subscription plan management** — New `PlansManagementView.vue` at `/admin/plans` with full CRUD for plans (name, slug, price, currency, max tables, max reservations/month). Backed by `subscription_plans` DB table with migration `20260719000001`. Plans are cached for 30s in `tenantSubscription.service.js` with `DEFAULT_PLANS` fallback.
- **Platform payment dashboard** — New `PlatformPaymentDashboard.vue` at `/admin/payments` showing per-tenant reservation payment counts (unpaid/deposit/partial/paid), expected revenue, collected amount, outstanding balance, and recent payment history across all tenants.
- **Access Tenant flow** — `TenantDetailView.vue` and tenant table rows include "Access" button that sets `authStore.currentTenant` and redirects to `/reservations`, causing all API requests to include `X-Tenant-Id`.
- **Backend** — Added `/api/v1/admin/plans/*` routes (plan.controller.js + plan.router.js), `/api/v1/admin/payments/summary` (platformPayment.controller.js + platformPayment.router.js), and updated `resolveTenant.js` to exempt new platform-admin paths.
- **Tests** — Backend: 126/126 tests pass (22 suites). Updated `tenantSubscription.test.js` to mock `db.subscriptionPlan`.

### Verification
- Frontend: `npm run build` succeeds
- Backend: tests pass
- Git: committed as `9f37837` and pushed to `RTRS` remote (main)

### Platform Admin — 14 Expanded Features
- **Tenant usage monitoring** — `/admin/usage` shows per-tenant usage vs plan limits with 80%+ warnings. Backend: `usage.controller.js`, `usage.dao.js`, `usage.router.js`.
- **Revenue reports** — `/admin/revenue` with MRR trends, revenue by plan, LTV by tenant. Backend: `revenue.controller.js`, `revenue.dao.js`, `revenue.router.js`.
- **Bulk operations** — `/admin/bulk` for bulk suspend, change plan, send email. Backend: `bulkAction.controller.js`, `bulk.dao.js`, `bulkAction.router.js`.
- **Support notes** — Integrated into `TenantDetailView.vue` with add/delete. Backend: `note.controller.js`, `note.dao.js`, `note.router.js`.
- **Trial management** — `/admin/trials` to extend trial days and convert trial-to-paid. Backend: `trial.controller.js`, `trial.router.js`.
- **Invoice management** — `/admin/tenants/:id/invoices` with full CRUD. Backend: `invoice.controller.js`, `invoice.dao.js`, `invoice.router.js`.
- **Billing email templates** — `/admin/billing-emails` for payment reminders, suspension notices, trial expiry. Backend: `billingEmail.controller.js`, `billingEmail.router.js`.
- **Tenant status timeline** — `/admin/tenants/:id/timeline` visualizes status changes and audit entries. Backend: `statusTimeline.controller.js`, `statusTimeline.router.js`.
- **Grace period configuration** — `/admin/tenants/:id/grace-period` per-tenant/plan override. Backend: `gracePeriod.controller.js`, `gracePeriod.router.js`.
- **White-label branding** — `/admin/tenants/:id/branding` logo, primary color, custom domain. Backend: `whiteLabel.controller.js`, `whiteLabel.router.js`.
- **API key management** — `/admin/tenants/:id/api-keys` create/revoke with scopes. Backend: `apiKey.controller.js`, `apiKey.dao.js`, `apiKey.router.js`.
- **Platform audit log** — `/admin/audit` platform admin action trail. Backend: `platformAudit.controller.js`, `platformAudit.dao.js`, `platformAudit.router.js`.
- **Notification center** — `/admin/notifications` create/manage platform notifications. Backend: `notification.controller.js`, `notification.dao.js`, `notification.router.js`.
- **Onboarding checklist** — `/admin/tenants/:id/onboarding` tracks setup progress. Backend: `onboarding.controller.js`, `onboarding.dao.js`, `onboarding.router.js`.

**Database:** Migration `20260720000001-platform-admin-tables.js` creates 6 new tables (`tenant_notes`, `invoices`, `api_keys`, `platform_audit_logs`, `notifications`, `tenant_onboarding`) and adds columns to `tenants` and `subscription_plans`.

**Verification:**
- Frontend: `npm run build` + `npm run lint` pass
- Backend: 126/126 tests pass (22 suites)
- Git: committed as `8e41e6f` and pushed to `RTRS` remote (main)

---

## 2026-07-20 Session — Mockup Alignment, Test Teardown & Platform Fixes

### Frontend — PageHeader removal & mockup alignment
- Removed `<PageHeader>` from **all** `front-end/src/views/*.vue` files.
- Replaced each with an inline `topbar` div using the same pattern as earlier rewrites.
- Views updated: `RevenueReportView`, `AuditLogView`, `PaymentDashboardView`, `GroupManagementView`, `NoShowView`, `AboutView`, `RoleManagementView`, `FloorPlanEditorView`, `EmailTemplatesView`, `CustomerProfileView`, `SuperAdminOverviewView`, `HeatmapView`.
- `LoginView.vue` already matched `01-login.html` split-screen mockup; no rewrite needed.

### Backend — BullMQ/Jest teardown fix
- Root cause: `src/queues/queue.js`, `notification.queue.js`, and `report.queue.js` opened BullMQ Queue/Worker connections at module load time but never closed them.
- Fix: Added `closeAllQueues()`, `closeNotificationWorker()`, `closeReportWorker()`, and a `globalTeardown` in `jest.config.js`.
- Added `src/__mocks__/bullmq.js` with `moduleNameMapper` so tests never open real Redis TCP connections.
- Removed `--forceExit` from `back-end/package.json` test script.
- Result: `npm test` exits cleanly with **0 warnings**, **25 suites**, **155 tests passed**.

### Backend — Missing DB fields for trial/grace period
- Added `tenants.trialExtendsTo` and `tenants.convertedFromTrialAt` (migration `20260720000011`).
- Added `subscription_plans.gracePeriodDays` (migration `20260720000012`).
- Updated `db/models/tenant.js` and `db/models/subscriptionPlan.js` so Sequelize knows about the new columns.

### Backend — Notification route permission fix
- `src/tenant-platform/routes/notification.router.js` now requires `requirePermission("manage_tenants")` on all routes.
- Previously any authenticated user could create/list platform notifications.

### Backend — Revenue DAO hardcoded prices fixed
- `src/tenant-platform/DAOs/revenue.dao.js` hardcoded `29/79/0` for starter/growth/enterprise.
- Updated `getMrrTrends`, `getRevenueByPlan`, and `getLtvByTenant` to dynamically read prices from `subscription_plans`.

### Verification
- `cd front-end && npm run build` ✅ passes
- `cd front-end && npm run lint` ✅ passes
- `cd front-end && npm run test:unit` ✅ passes (20/20)
- `cd back-end && npm test` ✅ passes (25 suites, 155 tests) with **0 Jest teardown warnings**
