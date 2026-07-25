# Staff Integrity & Fraud Prevention: Specification

## Context

The platform serves both restaurant and salon tenants with staff-operated workflows. Daily operations involve handling cash, card, and mobile-money payments; applying discounts, voids, comps, and refunds; managing inventory; and redeeming packages or gift cards. Without structured oversight, these workflows create opportunities for internal theft and abuse. This specification defines a staff integrity module that detects, audits, and deters fraud while staying within the existing multi-tenant RBAC and audit-log architecture.

## Scope

This spec covers signals and controls that can be derived from existing tenant data and simple extension points. It does not introduce point-of-sale hardware integration or real-time video auditing.

## Approach

### 1. Transaction-level controls

- **Void / comp tracking by staff**
  - Every `void` or `comp` action requires a reason code and optional note.
  - Manager approval required when item value exceeds a tenant-configurable threshold.
  - Backend persists `voidedBy`, `approvedBy`, `reasonCode`, `originalAmount`, and timestamp.
  - Extends existing restaurant order/payment models and salon service/appointment records.

- **Refund anomaly detection**
  - Aggregate refund count, value, and refund-to-payment ratio per staff over rolling windows (7, 30, 90 days).
  - Flag staff exceeding tenant-configured thresholds: e.g., >5% refund ratio, >3 refunds in a shift, refunds within 5 minutes of payment.
  - Backend job runs daily via BullMQ; results stored in a new `staff_integrity_alerts` table.

- **Discount abuse monitoring**
  - Track every discount application: staff, discount type, amount, associated order/appointment, and authorization.
  - Flag stacked discounts, discounts exceeding policy limits, and high discount frequency per staff.
  - Integrate with existing `subscription_plans` feature flags to enable per-tenant discount policies.

### 2. Cash and reconciliation controls

- **Cash vs. card reconciliation gaps**
  - Shift-closing workflow where staff declare opening float, cash received, tips, payouts, and closing float.
  - Compare declared cash to `payments.method = 'cash'` totals for the shift.
  - Flag variance above configurable threshold (default ±1% or fixed amount).

- **Cash payment concentration**
  - Compute cash-to-total-payment ratio per staff over rolling windows.
  - Flag staff whose ratio is significantly higher than peer average or tenant baseline.

### 3. Inventory and retail controls

- **Inventory shrinkage alerts (restaurant)**
  - Map menu-item recipes to `inventoryItems` usage.
  - Compare expected consumption (from orders net of voids) to actual stock movements.
  - Alert when variance exceeds threshold; link to staff on duty during the period.

- **Product / retail shrinkage (salon)**
  - Track retail product sales and service add-on consumption against `inventoryItem` depletion.
  - Detect unauthorized manual stock adjustments or missing product sales records.

### 4. Operational behavior signals

- **Table / check duration alerts (restaurant)**
  - Detect occupied tables with unusually long durations but low or missing order totals.
  - Correlate with staff assigned to the table or section.

- **Service void / cancellation patterns (salon)**
  - Track last-minute appointment cancellations and no-shows by staff.
  - Detect fabricated cancellations where the same client books again with a different staff shortly after.

- **Gift card / package fraud detection (salon)**
  - Audit package redemptions: staff, client, service, remaining balance, and timestamp.
  - Flag excessive voids or unauthorized redemptions tied to a single staff member.

### 5. Cross-cutting analytics and workflow

- **Staff behavior scoring**
  - Composite risk score combining voids, refunds, discounts, cancellations, cash concentration, inventory variance, and approval overrides.
  - Score is tenant-scoped and calculated nightly by BullMQ worker.
  - Exposed to managers in a read-only dashboard; never exposed to the scored staff member.

- **Exception reporting dashboard**
  - New manager-facing view (`StaffIntegrityView.vue`) listing flagged staff, alert categories, severity, and drill-down to individual transactions.
  - CSV export with date/staff/action filters.
  - Read permission: `view_staff_integrity`; acknowledge/escalate permission: `manage_staff_integrity`.

- **Whistleblower / tip intake**
  - Anonymous form linked from tenant admin footer.
  - Submissions create encrypted entries in `platform_audit_logs` (platform-wide) or tenant-scoped `incident_reports` table.
  - Manager notification via existing notification center.

- **Cross-tenant fraud pattern library (platform-only)**
  - Anonymized aggregation of alert types and risk-score distributions across tenants.
  - Super-admin dashboard only; no PII leaves tenant boundary.

## Data model additions

### `void_reason_codes` table (tenant-scoped)
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `tenantId` | FK | nullable per existing partition pattern |
| `code` | string | e.g., `customer_complaint`, `kitchen_error`, `staff_error`, `theft_suspected` |
| `label` | string | Display label |
| `requiresApproval` | boolean | |
| `approvalThreshold` | decimal | Amount above which manager approval is required |

### `staff_integrity_alerts` table (tenant-scoped)
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `tenantId` | FK | nullable per existing partition pattern |
| `staffId` | FK | |
| `alertType` | ENUM | `high_voids`, `refund_ratio`, `discount_abuse`, `cash_variance`, `shrinkage`, `cancellation_pattern`, `gift_card_fraud`, `concentration` |
| `severity` | ENUM | `low`, `medium`, `high`, `critical` |
| `description` | text | Human-readable summary |
| `evidence` | JSON | Snapshot of supporting records |
| `status` | ENUM | `open`, `acknowledged`, `investigating`, `resolved`, `dismissed` |
| `acknowledgedBy` | FK | Manager who acknowledged |
| `createdAt` | timestamp | |
| `resolvedAt` | timestamp | |

### `shift_reconciliations` table (tenant-scoped)
| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `tenantId` | FK | |
| `staffId` | FK | Staff closing the shift |
| `locationId` | FK | Optional multi-location support |
| `openedAt` | timestamp | |
| `closedAt` | timestamp | |
| `openingFloat` | decimal | |
| `cashSales` | decimal | Derived from payments |
| `declaredCash` | decimal | Staff declaration |
| `variance` | decimal | Computed |
| `status` | ENUM | `balanced`, `variance`, `under_review` |

## Key decisions

- **Leverage existing audit infrastructure**: Alerts and transaction records write to `platform_audit_logs` and tenant-scoped tables; no separate audit pipeline.
- **Tenant-configurable thresholds**: Default values per vertical, but each tenant can override via `tenant.settings`.
- **No real-time blocking**: First phase is detection and alerting; enforcement (e.g., require manager PIN for voids) is Phase 2.
- **Privacy-by-design**: Cross-tenant pattern library uses aggregated, anonymized metrics only; individual staff names remain inside tenant boundaries.
- **Vertical reuse**: Restaurant and salon share the same alert framework but use different signal sources (orders vs. appointments).

## Files to create / modify

| File | Change |
|------|--------|
| `back-end/src/db/migrations/YYYYMMDDHHMMSS-create-void-reason-codes.js` | New table |
| `back-end/src/db/migrations/YYYYMMDDHHMMSS-create-staff-integrity-alerts.js` | New table |
| `back-end/src/db/migrations/YYYYMMDDHHMMSS-create-shift-reconciliations.js` | New table |
| `back-end/src/models/voidReasonCode.js` | Model |
| `back-end/src/models/staffIntegrityAlert.js` | Model |
| `back-end/src/models/shiftReconciliation.js` | Model |
| `back-end/src/services/staffIntegrity.service.js` | Scoring and alert generation |
| `back-end/src/services/shiftReconciliation.service.js` | Shift close logic |
| `back-end/src/jobs/staffIntegrity.worker.js` | BullMQ nightly scoring job |
| `back-end/src/routes/staffIntegrity.router.js` | Manager API routes |
| `back-end/src/middleware/auth.js` | New permissions: `view_staff_integrity`, `manage_staff_integrity` |
| `front-end/src/views/staff/StaffIntegrityView.vue` | Manager dashboard |
| `front-end/src/views/staff/ShiftReconciliationView.vue` | Shift close UI |
| `front-end/src/config/sidebarItems.ts` | Add nav items |

## Out of scope

| Item | Reason |
|------|--------|
| POS hardware integration | Too broad; scope is software signals |
| Live video / biometric verification | Hardware and privacy complexity |
| Machine-learning anomaly models | Phase 2; rule-based thresholds are sufficient to start |
| Automated disciplinary actions | Requires HR/legal workflow beyond platform scope |

## Verification

| Check | Command | Expected |
|-------|---------|----------|
| Backend tests | `cd back-end && npm test` | New + existing tests pass |
| Frontend build | `cd front-end && npm run build` | Clean build |
| Frontend lint | `cd front-end && npm run lint` | Clean lint |
| Fraud alert generation | Manual: trigger a refund above threshold and run worker | Alert appears in `staff_integrity_alerts` |
| Manager dashboard | Browser: navigate to staff integrity view | Alerts render with filters and export |
| RBAC | Login as staff without permission | View is hidden; API returns 403 |

## STOP conditions

- Do not proceed if tenant settings cannot safely store new threshold keys without migration.
- Do not proceed if existing payment/order records lack staff attribution; backfill first.
- Pause if legal review flags whistleblower anonymity requirements under Ghana DPA 2012 before storing tips.
