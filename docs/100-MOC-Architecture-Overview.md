---
title: Architecture Overview
date: 2026-06-29
tags:
  - architecture
  - overview
  - backend
  - frontend
  - database
  - obsidian-index
related:
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[501-Security-Fixes]]"
  - "[[502-Bug-Fixes]]"
  - "[[503-UI-UX-Improvements]]"
  - "[[504-RBAC-System]]"
  - "[[505-Payment-System]]"
  - "[[506-Heatmap-Analytics]]"
  - "[[508-Waitlist-System]]"
  - "[[601-Key-Decisions]]"
  - "[[701-Audit-Log]]"
  - "[[702-Login-Lockout]]"
---

# Architecture Overview: Restaurant Table Reservation System

> [!abstract] Project MOC
> Full-stack restaurant table reservation system with real-time capabilities. Backend Express/Sequelize/MySQL on port 8000; frontend Vue 3/PrimeVue on port 8080. Socket.io for live table-freed events.

---

## Stack Summary

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js + Express |
| Backend ORM | Sequelize + MySQL |
| Real-Time | Socket.io |
| Authentication | JWT (256-bit secret, rotation support) |
| Authorization | RBAC (roles, groups, granular permissions) |
| Frontend Framework | Vue 3 (Composition API) + TypeScript |
| Frontend UI | PrimeVue + Tailwind CSS |
| State Management | Pinia |
| Build Tool | Vite |
| Testing | Playwright (E2E) |

---

## Repo Structure

```
restaurant-table-reservation-system/
├── back-end/
│   ├── src/
│   │   ├── routes/          # 11 route files (API v1)
│   │   ├── controllers/     # 10 controller files
│   │   ├── services/        # 9 service files (business logic)
│   │   ├── DAOs/            # 10 DAO files (data access)
│   │   ├── middleware/      # 12 middleware files
│   │   ├── db/
│   │   │   ├── models/      # 15 Sequelize models
│   │   │   ├── migrations/  # 24 migration files
│   │   │   └── seeders/     # 6 seeder files
│   │   └── utils/           # Server init, JWT rotation, route helpers
│   └── ecosystem.config.js  # PM2 production config
├── front-end/
│   ├── src/
│   │   ├── views/           # 23 page views
│   │   ├── components/      # 33 reusable components
│   │   ├── router/          # 21 Vue Router routes
│   │   ├── stores/          # 1 Pinia store (auth)
│   │   ├── services/        # 12 API service files
│   │   ├── constants/       # Shared constants
│   │   ├── utils/           # Logger, filter utilities
│   │   └── assets/          # base.css (CSS custom properties)
│   └── index.html
├── docs/                    # Obsidian documentation vault
├── deploy-prod.sh           # Production deployment with rollback
├── apache-production.conf   # Apache reverse proxy config
├── nginx-production.conf    # Nginx reverse proxy config
├── ecosystem.config.js      # PM2 cluster config (root)
└── CHANGELOG.md             # Version changelog
```

---

## Backend Route Map

```
/api/v1
├── /                    # GET /info (app metadata)
├── /health              # Health check
├── /csrf-token          # CSRF token endpoint
├── /tables              # Table CRUD + staff assignment
├── /reservations        # Reservation CRUD + bulk ops + heatmap + payments + staff
├── /auth                # Login, register, logout, lockout
├── /schedule            # Weekly hours + holidays management
├── /audit-logs          # Security event retrieval
├── /rbac                # Roles, groups, permissions
├── /waitlist            # Waitlist CRUD + stats
├── /payments            # Payment history + revenue time-series
├── /reports             # General reports
├── /customers           # Customer management
└── /stats               # Request metrics
```

---

## Frontend Route Map

| Path | View | Permission |
|---|---|---|
| `/` | HomeView | Public |
| `/login` | LoginView | Public |
| `/register` | RegisterView | Public |
| `/reservations` | ReservationsView | authenticated |
| `/new-reservation` | NewReservationView | authenticated |
| `/search` | SearchView | authenticated |
| `/add-table` | AddTableView | manage_tables |
| `/admin/settings` | AdminSettingsView | admin |
| `/schedule` | ScheduleView | manage_schedule |
| `/calendar` | CalendarView | manage_schedule |
| `/floor-plan` | FloorPlanView | manage_tables |
| `/reports` | ReportView | view_reservations |
| `/heatmap` | HeatmapView | view_reservations |
| `/tables/manage` | TableManagementView | manage_tables |
| `/staff/manage` | StaffManagementView | manage_staff |
| `/roles/manage` | RoleManagementView | manage_roles |
| `/groups/manage` | GroupManagementView | manage_groups |
| `/admin/payments` | PaymentDashboardView | admin |
| `/waitlist` | WaitlistView | manage_tables |
| `/audit-logs` | AuditLogView | view_audit_logs |
| `/about` | AboutView | Public |
| `/:pathMatch(.*)*` | NotFoundView | — |

---

## Key Files to Read

- `back-end/src/utils/server.js` - Server bootstrap, Socket.io, middleware stack
- `back-end/src/middleware/auth.js` - JWT auth + RBAC `requirePermission`
- `back-end/src/DAOs/reservation.dao.js` - Hybrid delete, bulk ops, heatmap, stats
- `back-end/src/routes/reservation.router.js` - 11 reservation endpoints
- `front-end/src/components/TheSidebar.vue` - Collapsible sidebar navigation
- `front-end/src/views/FloorPlanView.vue` - Drag-and-drop floor plan
- `front-end/src/views/RevenueReportView.vue` - Revenue dashboard with SVG charts

---

## Uncommitted Changes

25 files changed, ~8,921 insertions, ~4,123 deletions across backend, frontend, docs, and deployment configs.

---

## Active Ports

| Service | Port |
|---|---|
| Backend (API + Socket.io) | **8000** |
| Frontend (Vite dev) | **8080** |
| Also checked | 8081, 8082 |
