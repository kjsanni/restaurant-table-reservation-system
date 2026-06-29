---
title: No-Show Tracking
date: 2026-06-29
tags:
  - features
  - no-show
  - reservations
  - widget
  - backend
  - frontend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[502-Bug-Fixes]]"
---

# No-Show Tracking

> [!abstract] Reservation No-Show Management
> One-click no-show marking and a dashboard widget tracking no-show metrics over time.

---

## Backend Support

The `Reservation` model already includes `resStatus = 'missed'` in its ENUM. No schema changes required.

### Reservation Statuses
| Value | Meaning |
|---|---|
| `pending` | Awaiting confirmation |
| `confirmed` | Confirmed by restaurant |
| `seated` | Party is seated |
| `completed` | Meal finished, table freed |
| `cancelled` | Reservation cancelled |
| `missed` | No-show (auto or manual) |

### Endpoint
Existing `PATCH /api/v1/reservations/:id` accepts `resStatus: "missed"`.

---

## No-Show Widget

**Component**: `front-end/src/components/NoShowWidget.vue`  
Integrated into reservation views via `TheReservations.vue` and related components.

### Features
- Total reservations in selected period
- No-shows count
- No-show rate percentage (color-coded)
- Time period selector: Day / Week / Month / Custom
- Trend indicator (vs previous period)
- Tooltip explaining calculation formula

### Color Coding
| Rate | Color |
|---|---|
| < 5% | Green |
| 5–15% | Yellow |
| > 15% | Red |

### UI Actions
- **Mark No-Show** button on reservation cards
- Confirmation modal via `PopupBox`
- On confirm, calls `PATCH` with `resStatus: missed` and refreshes local data

---

## Frontend Integration Points

| Component | Integration |
|---|---|
| `TheReservations.vue` | "Mark No-Show" button on pending cards |
| `TheSearch.vue` | No-show action in search results |
| `TableView.vue` | No-show action option in table rows |

---

## Key Files

| Layer | File |
|---|---|
| Frontend Component | `front-end/src/components/NoShowWidget.vue` |
| Frontend Views | `TheReservations.vue`, `TheSearch.vue`, `TableView.vue` |
| Backend | Uses existing `PATCH /api/v1/reservations/:id` with `resStatus` |
