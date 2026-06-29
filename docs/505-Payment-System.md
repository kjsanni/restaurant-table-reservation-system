---
title: Payment System
date: 2026-06-29
tags:
  - features
  - payments
  - revenue
  - backend
  - frontend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[501-Security-Fixes]]"
---

# Payment System — Tracking, Classification & Revenue Reports

> [!abstract] Payment Lifecycle
> Record payments, auto-classify reservation status, and visualize revenue trends.

---

## Database Model

| Model | Table | Key Fields |
|---|---|---|
| `Payment` | `payments` | `id`, `reservationId`, `method` (cash/card/transfer/other), `amount`, `paidAt` (default NOW), `notes` |

### Reservation Payment Fields
- `paymentStatus` ENUM: `deposit`, `partial`, `paid`, `unpaid` (default `unpaid`)
- `expectedTotal` — Budget estimate for the reservation

---

## Auto-Classification Logic

When a payment is added, `paymentService.js` re-evaluates the reservation:

| `totalPaid` vs `expectedTotal` | Resulting `paymentStatus` |
|---|---|
| `totalPaid === 0` | `unpaid` |
| `0 < totalPaid < expectedTotal` | `deposit` |
| `totalPaid >= expectedTotal` | `paid` |

If `expectedTotal` is `0` or missing, the reservation stays `unpaid` but payments are still recorded.

---

## API Endpoints

### Reservation-Scoped Payments
| Method | Path | Permission | Handler |
|---|---|---|---|
| GET | `/api/v1/reservations/:id/payments` | view_reservations | `getPaymentsHandler` |
| POST | `/api/v1/reservations/:id/payments` | edit_reservations | `addPaymentHandler` |
| DELETE | `/api/v1/reservations/:id/payments/:paymentId` | edit_reservations | `removePaymentHandler` |

### Payment History & Revenue
| Method | Path | Permission | Handler |
|---|---|---|---|
| GET | `/api/v1/payments/history` | view_reservations | `getHistoryHandler` |
| GET | `/api/v1/payments/revenue` | view_reservations | `getRevenueStatsHandler` |
| GET | `/api/v1/payments/revenue/time-series` | view_reservations | `getRevenueTimeSeriesHandler` |

---

## Revenue Time-Series API

### Request
```
GET /api/v1/payments/revenue/time-series?from=2026-06-01&to=2026-06-30&granularity=day
```

### Query Parameters
| Param | Values | Description |
|---|---|---|
| `from` | ISO date | Start of range (required) |
| `to` | ISO date | End of range (required) |
| `granularity` | `day`, `week`, `month` | Bucket size (optional, default `day`) |

### Response
```json
{
  "success": true,
  "series": [
    {
      "period": "2026-06-29",
      "periodLabel": "2026-06-29",
      "total": 300,
      "count": 3,
      "byMethod": {
        "cash": { "total": 100, "count": 1 },
        "card": { "total": 200, "count": 2 }
      }
    }
  ],
  "summary": {
    "totalRevenue": 300,
    "totalPayments": 3,
    "avgPayment": 100
  }
}
```

---

## Payment Dashboard View

**File**: `front-end/src/views/PaymentDashboardView.vue`  
**Route**: `/admin/payments` (admin-only)

### Features
- Summary cards: total revenue, total transactions, average payment
- CSS horizontal bar chart (proportional widths, color-coded by status)
- Filterable/sortable reservation table (filters by payment status and reservation status)
- Editable `expectedTotal`
- "Add Payment" flow with method selection and auto-classification feedback
- CSV export of series data (from RevenueReportView)

---

## Revenue Report View

**File**: `front-end/src/views/RevenueReportView.vue`  
**Route**: `/admin/reports/revenue` (admin-only)

### Features
- Preset range buttons: Today, This Week, This Month, Custom
- Granularity selector: Day / Week / Month
- Summary cards: Total Revenue, Total Transactions, Avg Transaction
- SVG bar chart for total sales per period
- SVG stacked bar chart for sales by payment method
- CSV export

---

## Payment Status Badges (Table Views)

| Status | Color | Hex |
|---|---|---|
| `paid` | Green | `#22c55e` |
| `partial` | Amber | `#f59e0b` |
| `deposit` | Blue | `#3b82f6` |
| `unpaid` | Gray | `#9ca3af` |

---

## Key Files

| Layer | File |
|---|---|
| Model | `back-end/src/db/models/payment.js` |
| Migration | `back-end/src/db/migrations/20260627000009-create-payments.js` |
| DAO | `back-end/src/DAOs/payment.dao.js` |
| Service | `back-end/src/services/paymentService.js` |
| Controller | `back-end/src/controllers/payment.controller.js` |
| Routes | `back-end/src/routes/payment.router.js` |
| Frontend Service | `front-end/src/services/paymentAPI.js`, `reservationAPI.js` |
| Frontend Views | `PaymentDashboardView.vue`, `RevenueReportView.vue` |
