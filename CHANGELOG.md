# Changelog — Restaurant Table Reservation System

All notable changes to this project will be documented in this file.

---

## [Unreleased] — 2026-06-29

### Added — Comprehensive Documentation Update
- **Obsidian Vault**: Created `docs/` directory with 13 interconnected markdown files
- **New Topics**: RBAC system, payment system, heatmap analytics, no-show tracking, waitlist system docs
- **Updated**: Architecture overview, frontend/backend architecture, database schema, key decisions
- **Project Docs**: README, CHANGELOG, DEPLOYMENT-GUIDE, SECURITY_AUDIT_REPORT, SESSION_NOTES all updated

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
