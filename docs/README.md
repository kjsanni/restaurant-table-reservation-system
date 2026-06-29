---
title: DOCUMENTATION INDEX
date: 2026-06-29
tags:
  - index
  - obsidian
aliases:
  - docs
  - INDEX
---

# Documentation Index

> [!note] Restaurant Table Reservation System
> Full-stack application: Express/Sequelize backend + Vue 3/PrimeVue frontend with RBAC, real-time Socket.io, and comprehensive admin tools.

---

## Core Architecture
- [[100-MOC-Architecture-Overview]] - Main overview (MOC)
- [[202-Backend-Architecture]] - Express/Sequelize + Socket.io implementation
- [[302-Frontend-Architecture]] - Vue 3 + PrimeVue + Pinia stack
- [[401-Database-Schema]] - 15 models, 24 migrations
- [[601-Key-Decisions]] - Architecture decision log

---

## Work Categories

#### Security ([[:category:security|tag]])
- [[501-Security-Fixes]] - CSRF, CORS, JWT, CSP, rate limiting hardening
- [[702-Login-Lockout]] - Account lockout mechanism (5 attempts/15 min)
- [[701-Audit-Log]] - Security event tracking

#### Bug Fixes ([[:category:bug-fixes|tag]])
- [[502-Bug-Fixes]] - Data integrity, NaN, iteration failures, API gaps

#### UI/UX ([[:category:frontend|tag]])
- [[503-UI-UX-Improvements]] - Standardization, sidebar redesign, theming, logger

#### Features ([[:category:features|tag]])
- [[504-RBAC-System]] - Role-based access control, groups, permissions
- [[505-Payment-System]] - Payment tracking, auto-classification, revenue reports
- [[506-Heatmap-Analytics]] - 1D weekly + 2D date-hour heatmaps
- [[507-NoShow-Tracking]] - No-show marking and stats widget
- [[508-Waitlist-System]] - Waitlist management and auto-seat workflow

#### Architecture Decisions ([[:category:decisions|tag]])
- [[601-Key-Decisions]] - Decision log with rationale
- [[702-Login-Lockout]] - Account lockout implementation details

#### Change Tracking
- [[202-Changes-Overview]] - Files changed, stats, uncommitted
- [[900-Session-Summary]] - Session summary and checklist

#### Testing
- [[TEST-FINDINGS-2026-06-29]] - Test execution results and validation

---

## Quick Links

| Topic | File |
|---|---|
| Health endpoint | [[202-Backend-Architecture#server-configuration]] |
| JWT rotation | [[501-Security-Fixes#jwt-security]] |
| Soft-delete pattern | [[401-Database-Schema#key-migration-patterns]] |
| Login lockout | [[702-Login-Lockout]] |
| Audit logging | [[701-Audit-Log]] |
| CSS theming | [[302-Frontend-Architecture#css-custom-properties]] |
| Sidebar navigation | [[503-UI-UX-Improvements#sidebar-navigation-redesign]] |
| RBAC API | [[504-RBAC-System#api-endpoints]] |
| Payment API | [[505-Payment-System#api-endpoints]] |
| Revenue reports | [[505-Payment-System#revenue-report-dashboard]] |
| Heatmap v2 API | [[506-Heatmap-Analytics#heatmap-v2-api]] |
| Waitlist auto-seat | [[508-Waitlist-System#auto-seat-workflow]] |

---

## Stats

- **Backend routes**: ~11 route files
- **Frontend views**: 23 views
- **Frontend components**: 33 components
- **Frontend router**: 21 routes
- **Database migrations**: 24
- **Models**: 15
- **Middleware**: 12 files
- **Uncommitted files**: 25
- **Insertions**: ~8,921
- **Deletions**: ~4,123

---

## Active Services

| Service | Address | Purpose |
|---|---|---|
| Backend | `http://localhost:8000` | API + Socket.io |
| Frontend | `http://localhost:8080` | Vue 3 SPA |
| Also checked | 8081, 8082 | Reserved |
