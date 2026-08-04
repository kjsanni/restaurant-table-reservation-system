# Changelog — Restaurant Table Reservation System

All notable changes to this project will be documented in this file.

---

## [Unreleased] — 2026-08-04

### Added — Release Automation
- **Changesets** — Added `.changeset/` config for per-PR changelog entries; `release.yml` workflow auto-generates CHANGELOG, bumps `VERSION`, and creates GitHub releases on merge to `main`
- **Branch protection** — Added `.github/branch-protection.json` and `.github/dependabot.yml` config for automated PR review enforcement and dependency updates
- **Release workflow** — New `release.yml` runs changesets version bump, syncs `VERSION` and sub-package.json versions, then creates a tagged GitHub release
- **PR template** — Added `.github/PULL_REQUEST_TEMPLATE.md` enforcing conventional commits, testing checklist, and project constraints (nullable `tenantId`, salon CSS vars, RBAC rules)
- **`version:bump` script** — Root `package.json` now has a script to sync `VERSION` + root `package.json` in one command (`npm run version:bump -- 1.2.0`)

### Fixed — Security & Lint (Codacy/Semgrep)
- **SQL Injection in migrations** — Replaced raw `UPDATE \`${table}\`` queries with Sequelize `queryInterface.bulkUpdate()` in `20260717000003-backfill-default-tenant.js` and `20260718000003-backfill-remaining-nulls.js` (Semgrep)
- **CSRF cookie HttpOnly** — Added `nosemgrep` suppression comments for XSRF-TOKEN cookie in `csrf.js` and `server.js`; `httpOnly: false` is intentional for double-submit CSRF pattern (frontend JS must read the token)
- **Unpinned GitHub Actions** — Pinned `appleboy/ssh-action` to commit SHA `029f5b4aeeeb58fdfe1410a5d17f967dacf36262`, `trufflesecurity/trufflehog@main` → `@v3` with SHA `fda044631b344997a4556f52aadbd7c8275d0802`, `podman/setup-podman@v3` (repo deprecated) → direct `podman --version` verification (ubuntu-latest has Podman pre-installed) (Codacy)
- **Non-literal require** — Added `codacy:ignore-next-line` suppressions for dynamic `require(mod.path)` in `erpnext-routes.test.js` (hardcoded array paths) and `require(fullPath)` in `db/models/index.js` (readdirSync of trusted internal directory) (Codacy)
- **SSRF webhook URL** — Added `codacy:ignore-next-line` suppression in `webhook.service.js` explaining that `sub.url` is pre-validated by `validateWebhookUrl` (blocks non-HTTPS, private IPs, `localhost`, link-local) (Codacy)
- **Dynamic path construction** — Added `codacy:ignore-next-line` suppressions in `module.registry.js` for filesystem operations on internally-registered module paths (Codacy)
- **HSTS numeric literal** — Replaced magic number `31536000` with computed expression `365 * 24 * 60 * 60` in `server.js` for self-documenting code

### Changed — Version Sync
- **Package versions synced** — `back-end/package.json` and `front-end/package.json` bumped from `1.0.0` → `1.1.0` to match root `VERSION` file and root `package.json`

### Added — Tooling
- **`@changesets/cli`** — Added as root `devDependency` for changelog management

---

## [Unreleased] — 2026-07-29

### Added
- **Compliance automation** — `POST /api/v1/admin/compliance/auto-fulfill-dsar` for auto-fulfilling pending DSAR requests, `GET /api/v1/admin/compliance/reminders` for compliance reminder scheduling, `GET /api/v1/admin/compliance/report` for automated compliance report generation
- **Advanced analytics** — `GET /api/v1/admin/analytics/revenue` for revenue analytics, `GET /api/v1/admin/analytics/bookings` for booking analytics, `GET /api/v1/admin/analytics/payments` for payment method analytics, `GET /api/v1/admin/analytics/usage` for platform usage metrics
- **Multi-tenant backend Jest tests** — 103 tests across 9 new files covering resolveTenant middleware, JWT auth, BullMQ, caching, Paystack formatting, and ShaQ Express credentials

### Changed
- **Compliance controller** — Refactored `getComplianceScorecardHandler` to extract shared `computeScorecard` helper, enabling reuse by the report endpoint
- **Analytics controller** — Added `getRevenueAnalyticsHandler`, `getBookingAnalyticsHandler`, `getPaymentAnalyticsHandler`, `getUsageAnalyticsHandler` endpoints

### Fixed
- **Operator CRUD** — Old `OperatorsView.vue` stub `saveOperator()`/`deleteOperator()` methods superseded by `PlatformRoleManagementView.vue` and `RoleManagementView.vue` which call real backend services via `adminAPI.assignPlatformRole` and `adminAPI.revokePlatformRole`

### Changed
- **Frontend layout refactor** — Removed shared `App.vue` layout; each portal now owns its own layout (`SuperAdminLayout.vue`, `TenantLayout.vue`, customer portal standalone sidebar)
- **Super-admin sidebar contrast fix** — White text now renders correctly on dark `brand-900` sidebar background
- **Super-admin sidebar collapse binding** — Collapse/expand toggle now correctly applies the `minimized` class
- **DebugToolsView template fix** — Fixed undefined `venueData` template ref causing Vue warnings

### Security
- **Mass-assignment hardening** — Added explicit field allowlists to `platformReferral`, `marketplace`, `caseStudy` (update), and `encryptionKey` (create) controllers
- **SSRF protection** — `sync.service.js` `postToPos` validates POS API URLs against private/loopback/link-local hosts
- **Error message hardening** — `monitoring.controller.js` no longer leaks `err.message` in 500 responses
- **Route guard fix** — Added missing `requirePermission("manage_tenants")` to `platformAudit.router.js` `/recent`
- **Dependency patch** — Merged postcss `8.5.16 → 8.5.23` security fix (source-map path-traversal)

### Added
- **Super-admin: password policy settings UI** — Platform settings page supports password policy configuration
- **Super-admin: session management view** — Admins can view and manage active sessions
- **Super-admin: incident response actions** — Lock tenant, reset tokens, force logout from incident detail view
- **Super-admin: TOTP enforcement** — Mandatory TOTP for super-admin logins when `totpEnabled` is set
- **TOTP fields on User model** — Added `totpSecret`, `totpEnabled`, `totpConfirmed` columns

---

## [1.1.0] — 2026-07-28

### Added
- **Super-admin: tenant soft-delete** — `DELETE /api/v1/admin/tenants/:id` sets status=cancelled with slug confirmation and audit logging
- **Super-admin: tenant GDPR export** — `GET /api/v1/admin/tenants/:id/export` returns tenant data as JSON download
- **Super-admin: Paystack key rotation** — `POST /api/v1/admin/paystack/keys/rotate` validates new secret key, saves config, and logs audit event; UI in `PlatformSettingsCard.vue`

---

## [Unreleased] — 2026-07-27

### Added
- **Super-admin: tenant soft-delete** — `DELETE /api/v1/admin/tenants/:id` sets status=cancelled with slug confirmation and audit logging
- **Super-admin: tenant GDPR export** — `GET /api/v1/admin/tenants/:id/export` returns tenant data as JSON download
- **Super-admin: Paystack key rotation** — `POST /api/v1/admin/paystack/keys/rotate` validates new secret key, saves config, and logs audit event; UI in `PlatformSettingsCard.vue`

---

## [Unreleased] — 2026-07-01

### Added
- **Table price field** — `price` DECIMAL(10,2) column on `tables` for pricing support
- **Payment discount field** — `discount` DECIMAL(10,2) column on `payments` for discounts
- **Table hierarchy** — `parentTableId` for merged table relationships
- **LoadingSpinner component** — Reusable loading spinner with size variants
- **ErrorBanner component** — Error display with optional retry callback
- **PageHeader component** — Page headers with breadcrumb navigation

### Fixed
- **Linting** — Added TypeScript ESLint parser for Vue components
- **TableView.vue** — Removed unsafe return in finally block
- **TimeSlotGrid.vue** — Converted from TS to JS to match linter config
- **Migration casing** — Fixed `Tables` → `tables` table name casing

---

## [Unreleased] — 2026-06-29

### Added — Code Modernization & Features

#### Frontend Views & Components
- **2 New Views**: `RevenueReportView.vue`, `HeatmapView.vue` (refactored)
- **1 New Component**: `Heatmap2D.vue` for 2D date-hour heatmap visualization
- **Sidebar Navigation**: Replaced top navbar with collapsible dark sidebar (`TheSidebar.vue`)
- **Design System**: Unified theming with Inter font, status chips, spinner loading, rounded cards
- **23 Views, 33 Components** fully cataloged in docs

#### Backend Features
- **RBAC System**: Roles, groups, permissions with `requirePermission` middleware
- **Payment Tracking**: Auto-classification (deposit/partial/paid/unpaid), revenue time-series API
- **Heatmap v2**: Date-range 2D matrix with `date-hour` and `calendar` modes
- **Staff Assignment**: Junction tables `table_staff` and `reservation_staff` with 5-table limit
- **Waitlist Auto-Seat**: Socket.io `table-freed` events + smart suggestion banner
- **No-Show Tracking**: One-click marking + `NoShowWidget` with color-coded rates

#### API Endpoints (Backend)
- `GET /api/v1/reservations/heatmap-v2` — 2D date-range heatmap
- `GET /api/v1/reservations/:id` — Single reservation fetch
- `POST /api/v1/reservations/:id/staff` — Assign staff to reservation
- `DELETE /api/v1/reservations/:id/staff/:userId` — Unassign staff
- `GET /api/v1/payments/revenue/time-series` — Revenue analytics
- `GET /api/v1/waitlist/suggest/:tableId` — Smart seating suggestions
- `POST /api/v1/waitlist/:entryId/seat` — Auto-seat from waitlist
- `GET /api/v1/rbac/roles` + full CRUD — Role management
- `GET /api/v1/rbac/groups` + full CRUD — Group management

#### Frontend Routing
- 21 Vue Router routes with permission-based guards
- Admin routes: `/admin/payments`, `/admin/settings`, `/admin/reports/revenue`
- Staff routes: `/tables/manage`, `/staff/manage`, `/roles/manage`, `/groups/manage`, `/waitlist`

#### Deployment
- `deploy-prod.sh` with rollback guard
- `apache-production.conf` + `nginx-production.conf` with Socket.io proxy
- `ecosystem.config.js` for PM2 cluster management
- `.env.production.example` and `.env.production` templates

---

## [Unreleased] — 2026-06-28

### Added — UI/UX Standardization
- Sidebar redesign with dark gradient theme and collapsible icon-only mode
- Consistent design system: Inter font family, rounded cards, status chips, spinner loading
- Logger implementation (`front-end/src/utils/logger.js`) with `[Vibe]` prefix
- Payment constants extracted to `front-end/src/constants/index.js`

### Fixed
- Hybrid reservation deletion (soft-cancel active, hard-delete terminal)
- Missing business validators restored (date past-check, 8-seat cap, closing hours, 2-min grace)
- `freeTable` changed from hard-delete to status update
- Cancel/delete blocking for seated reservations
- Phone validation regex (10–15 digits)
- Migration casing fixes (`Tables` → `tables`)
- `EditReservation.vue` `isModal` prop for popup fitting
- Sequelize User ↔ Table association fix (`belongsToMany` reverse)

---

## [Unreleased] — 2026-06-27

### Added — Security Hardening
- **CSRF**: Strict sameSite enforcement + cookie-based token endpoint
- **CORS**: Origin validation against env var (rejects wildcard in production)
- **JWT**: 256-bit secret + rotation support via `verifyTokenWithFallback`
- **CSP**: Environment-aware content security policy via `helmet` + custom middleware
- **Account Lockout**: 5 failed attempts / 15-minute lockout via `login_attempts` table
- **Audit Logging**: Comprehensive trail for auth and data mutations
- **Rate Limiting**: API brute-force protection middleware
- **Input Sanitization**: XSS prevention via `sanitize.js` middleware

### Added — Database Optimizations
- N+1 query removal in bulk operations (`bulkCancel`, `bulkUpdate`)
- Combined stats queries for reservation analytics
- Map lookups replacing `.find()` loops for O(1) access
- Sequelize connection pooling configured

### Added — RBAC Foundation
- Roles, groups, permissions tables + seeders
- `requirePermission` middleware for route protection
- Frontend permission-based action gating

### Added — Payment Foundation
- `Payment` model + migration
- Reservation `paymentStatus` column (`deposit`, `partial`, `paid`, `unpaid`)
- `expectedTotal` column for budget estimation
- Payment auto-classification logic

### Added — Waitlist Foundation
- `Waitlist` model + migration
- Waitlist CRUD endpoints
- Stats endpoint for waitlist summary

### Fixed — Production Socket.io WebSocket (2026-07-05)
- Fixed Apache `ProxyPassMatch` ordering in `apache-production.conf`
- Fixed PM2 cluster mode causing Engine.IO session loss → changed to single instance
- Fixed dotenv override order in `back-end/config/config.js` so `.env.production` values take precedence
- Fixed `CORS_ORIGINS` in `.env.production` to actual production IP

### Fixed — Production RBAC Permissions Bug (2026-07-05)
- Added `normalizePermissions()` in `back-end/src/DAOs/role.dao.js` to parse stringified JSON permissions
- Fixed `/tables/manage` route being blocked due to mangled permission object
