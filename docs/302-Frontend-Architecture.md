---
title: Frontend Architecture
date: 2026-06-29
tags:
  - frontend
  - architecture
  - vue
  - primevue
  - pinia
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[503-UI-UX-Improvements]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
---

# Frontend Architecture

> [!note] Dev Server
> Frontend runs on `localhost:8080` via Vite. Production assets served by Apache/Nginx + PM2.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Languages | TypeScript + JavaScript |
| Component Library | PrimeVue |
| Styling | Tailwind CSS + CSS custom properties |
| Build Tool | Vite |
| State Management | Pinia (1 store: `auth.js`) |
| Router | Vue Router (21 routes) |
| HTTP Client | Axios (with CSRF interceptor) |
| Charts | Custom SVG (no heavy chart library) |
| Real-time | Socket.io client (`table-freed` events) |

---

## File Organization

### Views (23 files)

| View | Route | Purpose |
|---|---|---|
| `HomeView.vue` | `/` | Dashboard landing |
| `LoginView.vue` | `/login` | Authentication |
| `RegisterView.vue` | `/register` | User registration |
| `ReservationsView.vue` | `/reservations` | Reservation cards + table assignment |
| `NewReservationView.vue` | `/new-reservation` | Reservation creation form |
| `SearchView.vue` | `/search` | Global search across reservations |
| `AddTableView.vue` | `/add-table` | Add new restaurant table |
| `TableManagementView.vue` | `/tables/manage` | Table grid + staff assignment |
| `FloorPlanView.vue` | `/floor-plan` | Drag-and-drop floor plan seating |
| `StaffManagementView.vue` | `/staff/manage` | Staff CRUD + permissions |
| `RoleManagementView.vue` | `/roles/manage` | RBAC role builder |
| `GroupManagementView.vue` | `/groups/manage` | Group management + member chips |
| `AdminSettingsView.vue` | `/admin/settings` | App settings (registration, reservations) |
| `ScheduleView.vue` | `/schedule` | Weekly hours + holidays |
| `CalendarView.vue` | `/calendar` | Closed days / opening hours calendar |
| `WaitlistView.vue` | `/waitlist` | Waitlist cards + stats |
| `HeatmapView.vue` | `/heatmap` | Weekly heatmap (Mon–Sun × hour) |
| `ReportView.vue` | `/reports` | General reporting dashboard |
| `RevenueReportView.vue` | `/admin/reports/revenue` | Revenue time-series + payment breakdown |
| `PaymentDashboardView.vue` | `/admin/payments` | Payment status dashboard + table view |
| `AuditLogView.vue` | `/audit-logs` | Security audit log browser |
| `AboutView.vue` | `/about` | Static about page |
| `NotFoundView.vue` | `/:pathMatch(.*)*` | 404 handler |

### Components (33 files)

| Component | Purpose |
|---|---|
| `TheSidebar.vue` | Collapsible sidebar navigation (dark theme) |
| `SidebarNavItem.vue` | Sidebar-specific nav item with active state |
| `PopupBox.vue` | Modal dialog system |
| `TheReservations.vue` | Reservation card list + intersection observer blur |
| `TheSearch.vue` | Search input + results |
| `TableView.vue` | Legacy table-row layout (used by PaymentDashboardView) |
| `RestaurantTable.vue` | Interactive table visual (floor plan) |
| `ReservationInfo.vue` | Reservation detail card |
| `NoShowWidget.vue` | No-show rate stats widget |
| `Heatmap2D.vue` | 2D date-hour heatmap matrix + calendar mode |
| `AssignStaff.vue` | Staff assignment/unassignment modal |
| `ChooseTable.vue` | Table selection popup |
| `SearchSkeleton.vue` | Loading skeleton for search |
| `ReservationsSkeleton.vue` | Loading skeleton for reservations |
| `AnimatedPlaceholder.vue` | Animated loading placeholder |
| `NotFoundResource.vue` | Empty state component |
| `SuccessMessage.vue` | Success notification |
| `ErrorMessage.vue` | Error notification |
| `ListContainer.vue` | List wrapper with consistent styling |
| `GridContainer.vue` | Grid layout wrapper |
| `ComboBox.vue` | Dropdown/select component |
| `TextBox.vue` | Text input wrapper |
| `ButtonFilled.vue` | Primary action button |
| `ButtonOutlined.vue` | Secondary action button |
| `ButtonAction.vue` | Action button variant |
| `ButtonHamburger.vue` | Mobile menu trigger |
| `ToggleSwitch.vue` | Boolean toggle switch |
| `EditReservation.vue` | Reservation edit form (supports full-page and modal modes) |
| `NavItem.vue` | Legacy nav item (deprecated) |
| `NavItems.vue` | Legacy nav container (deprecated) |
| `TheNavbar.vue` | Deprecated top navbar |
| `TheFooter.vue` | Footer with logo + copyright |

### Services (API clients)

| Service | Purpose |
|---|---|
| `API.js` | Axios instance + interceptors (CSRF, auth) |
| `authAPI.js` | Login, register, logout, lockout status |
| `reservationAPI.js` | Reservation CRUD, heatmap, payments, staff |
| `tableAPI.js` | Table CRUD, staff assignment, waiting staff lookup |
| `waitlistAPI.js` | Waitlist CRUD, stats, suggestions |
| `paymentAPI.js` | Payment history, revenue time-series |
| `scheduleAPI.js` | Schedule + holiday management |
| `reportAPI.js` | General reports |
| `customerAPI.js` | Customer management |
| `roleAPI.js` | RBAC role CRUD |
| `groupAPI.js` | RBAC group CRUD + user membership |
| `auditAPI.js` | Audit log queries |

---

## Logger Implementation

- `front-end/src/utils/logger.js`
- Structured logging
- Dev mode: `[Vibe]` prefix for consistent debugging
- Environment-aware log levels

---

## Permission Visibility

- Frontend action buttons must match backend permission requirements, not role names
- Use permission-based computed properties (e.g., `canEditReservations`) instead of role checks (e.g., `isAdmin`) for action gating
- Backend middleware (`protectedRoute`, `writeRoute`, `requirePermission`) enforces the same permission keys
- This prevents UI/API divergence when roles evolve or permissions are reassigned

---

## Design System

| Property | Value |
|---|---|
| Font family | Inter (Light, Medium, Bold) |
| Primary blue | `#3b82f6` |
| Success green | `#22c55e` |
| Danger red | `#ef4444` |
| Warning amber | `#f59e0b` |
| Neutral gray | `#6c757d` |
| Background | `#f5f5f5` (light pink tint) |
| Card surface | `#ffffff` |
| Border radius | 8px buttons, 10px cards, 12px containers, 14px modals |
| Shadows | Soft box shadows on cards |
| Loading | 0.8s linear infinite spinner ring |

---

## Router Guards

```javascript
// front-end/src/router/index.js
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) → redirect /login
  else if (to.meta.requiresAdmin && user.role !== 'admin') → redirect /
  else if (to.meta.requiresPermission && !user.permissions[perm]) → redirect /
  else next()
})
```

Routes support three guard levels: public, authenticated, admin-only, and permission-scoped.
