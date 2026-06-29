---
title: Heatmap Analytics
date: 2026-06-29
tags:
  - features
  - heatmap
  - analytics
  - backend
  - frontend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
---

# Heatmap Analytics

> [!abstract] Reservation Demand Visualization
> Two heatmap modes: weekly hour-of-day density and 2D date-range matrix.

---

## Heatmap v1 — Weekly Demand

**Endpoint**: `GET /api/v1/reservations/heatmap`  
**Scope**: Pending reservations only for current/future weeks  
**Response**: Mon–Sun × hour matrix with reservation counts

### Frontend
- **View**: `front-end/src/views/HeatmapView.vue` (route `/heatmap`)
- **Component**: `front-end/src/components/Heatmap.vue` (legacy)
- Cells are rounded with hover scale + blue border ring
- Count label shown inside cell when > 0
- Tooltip text on hover
- Legend displays actual count numbers inside color swatches

---

## Heatmap v2 — 2D Date-Hour Matrix

**Endpoint**: `GET /api/v1/reservations/heatmap-v2?from=...&to=...&mode=...`  
**Implementation**: `reservation.dao.js` → `getHeatmapV2(from, to, mode)`

### Modes

| Mode | Description |
|---|---|
| `date-hour` | Dates × Hours matrix with color intensity |
| `calendar` | Daily summary with peak hour per day |

### `date-hour` Response
```json
{
  "dates": ["2026-07-01", "2026-07-02"],
  "hours": ["09:00", "10:00", "11:00"],
  "matrix": [[5, 2, 0], [3, 4, 1]],
  "totalsPerDay": [7, 8],
  "totalsPerHour": [8, 6, 1]
}
```

### `calendar` Response
```json
{
  "days": [
    { "date": "2026-07-01", "count": 10, "peakHour": "19:00", "peakCount": 4 }
  ]
}
```

### Frontend Component
- **Component**: `front-end/src/components/Heatmap2D.vue` (new)
- Sub-components:
  - `HeatmapMatrix` — two-axis grid with inline color interpolation
  - `HeatmapCalendar` — 7-column calendar grid with drill-down
- Color scale legend: gray → blue → red
- Date range picker via PrimeVue Calendar
- Defensive `Array.isArray` fallback prevents `heatmapData.find is not a function` crash

---

## Filtering

- Both heatmap endpoints scope to `resStatus = 'pending'` by default
- `getHeatmapV2` accepts explicit date range for historical analysis

---

## Permission

| Endpoint | Required Permission |
|---|---|
| `GET /heatmap` | `view_reservations` |
| `GET /heatmap-v2` | `view_reservations` |

---

## Key Files

| Layer | File |
|---|---|
| DAO | `back-end/src/DAOs/reservation.dao.js` |
| Controller | `back-end/src/controllers/reservation.controller.js` |
| Routes | `back-end/src/routes/reservation.router.js` |
| Frontend View | `front-end/src/views/HeatmapView.vue` |
| Frontend Component | `front-end/src/components/Heatmap2D.vue` |
