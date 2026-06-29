---
title: Changes Overview
date: 2026-06-29
tags:
  - audit
  - changes
  - diff
  - obsidian-index
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[900-Session-Summary]]"
---

# Changes Overview

> [!info] Work Summary
> **25 uncommitted files** in working tree across backend, frontend, docs, and deployment configs. ~8,921 insertions, ~4,123 deletions.

---

## Uncommitted File Inventory

### Backend (`back-end/`)
| File | Type | Description |
|---|---|---|
| `src/DAOs/reservation.dao.js` | Modified | Heatmap v2, staff assignment, expectedTotal |
| `src/routes/reservation.router.js` | Modified | GET /:id, staff endpoints, heatmap-v2 |
| `.env.production.example` | New | Production env template |
| `ecosystem.config.js` | New | PM2 cluster config |

### Frontend (`front-end/`)
| File | Type | Description |
|---|---|---|
| `src/services/reservationAPI.js` | Modified | New API methods |
| `src/views/HeatmapView.vue` | Modified | Heatmap improvements (~260 lines refactored) |
| `src/components/Heatmap2D.vue` | New | 2D date-hour heatmap component |
| `src/views/RevenueReportView.vue` | New | Revenue dashboard with SVG charts |
| `.env.production` | New | Production frontend env |
| `start-frontend.sh` | New | Dev startup script |

### Root Level
| File | Type | Description |
|---|---|---|
| `CHANGELOG.md` | New | Version changelog |
| `DEPLOYMENT-GUIDE.md` | New | Production deployment instructions |
| `SECURITY_AUDIT_REPORT.md` | New | Security audit findings |
| `SESSION_NOTES.md` | New | Session changelog |
| `deploy-prod.sh` | New | Production deploy script with rollback |
| `apache-production.conf` | New | Apache reverse proxy |
| `nginx-production.conf` | New | Nginx reverse proxy |
| `ecosystem.config.js` | New | PM2 config (root) |
| `docs/` | New | Obsidian documentation vault (13 files) |
| `package-lock.json` | New | Dependency lockfile |
| `restaurant-table-reservation-system.code-workspace` | New | VS Code workspace |

---

## Staged Changes Detail

### `reservation.dao.js`
- Added `expectedTotal` to `findAllReservations` attributes
- Added `getHeatmapV2(from, to, mode)` for 2D analytics
- Added staff assignment methods: `getAssignedStaff`, `assignStaff`, `unassignStaff`

### `reservation.router.js`
- Added `GET /:reservationId` single reservation endpoint
- Added `/:reservationId/staff` and `/:reservationId/staff/:userId` staff endpoints
- Added `GET /heatmap-v2` endpoint

### `reservationAPI.js`
- Added `getHeatmapV2()`, `getOne()`, staff assignment/unassignment methods

### `HeatmapView.vue`
- Refactored from ~260 lines to concise implementation
- Added defensive `Array.isArray` fallback
- Added spinner loading state
- Rounded cells with hover scale + blue border ring
- Tooltip text on hover
- Count label shown inside cell when > 0

### New: `Heatmap2D.vue`
- Two-mode heatmap: `date-hour` matrix and `calendar` daily summary
- Color scale legend (gray → blue → red)
- Date range picker
- Hover tooltips with exact counts

### New: `RevenueReportView.vue`
- Preset range buttons (Today / Week / Month / Custom)
- Granularity selector (Day / Week / Month)
- Summary cards: Total Revenue, Total Transactions, Avg Transaction
- SVG bar chart for total sales
- SVG stacked bar chart for payment method breakdown
- CSV export
- Admin-only route: `/admin/reports/revenue`

---

## Change Categories

| Category | Files | Impact |
|---|---|---|
| Backend features | 2 | High |
| Frontend features | 4 | High |
| Deployment | 6 | Ops |
| Documentation | 13 | Maintenance |
| Config | 3 | Ops |
