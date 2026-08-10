# Multi-Location Architecture — Single Brand & Franchise Models

## Status: Design Document

This document defines the multi-location data model and platform behavior for both deployment modes:
- **Single-brand branches** — one operator, multiple locations, centralized control
- **Franchise model** — semi-autonomous franchisees, individual branding/billing, royalty tracking

The existing salon `locations` table and cross-location features form the foundation. This design extends them to cover the restaurant vertical and adds franchise-specific semantics without breaking single-location tenants.

---

## 1. Core Concept

A **location** is a physical place of business. A **tenant** is the billing/legal entity that owns one or more locations.

| Dimension | Single-Brand Branches | Franchise Model |
|---|---|---|
| Ownership | One tenant owns all locations | Each franchisee is a tenant (or sub-tenant) |
| Branding | Uniform across locations | Per-location branding allowed |
| Billing | Centralized tenant billing | Per-franchisee billing + platform royalty |
| Data isolation | All locations share data | Franchisee data isolated from other franchisees |
| Staff | Staff can work across branches | Staff bound to their franchisee's locations |
| Reporting | Aggregated + per-branch | Per-franchisee only (no cross-franchise aggregation unless explicitly allowed) |

---

## 2. Schema Changes

### 2.1 Extend `locations` Table

```sql
ALTER TABLE locations ADD COLUMN location_type ENUM('branch','franchise') DEFAULT 'branch';
ALTER TABLE locations ADD COLUMN franchisee_id INTEGER NULL; -- self-ref to tenant or dedicated franchisee table
ALTER TABLE locations ADD COLUMN brand_override JSON NULL; -- per-location branding overrides
ALTER TABLE locations ADD COLUMN royalty_percent DECIMAL(5,2) NULL; -- franchise only
ALTER TABLE locations ADD COLUMN settlement_account JSON NULL; -- payout details for franchisees
```

**Rationale:**
- `location_type` distinguishes centralized branches from semi-autonomous franchises.
- `franchisee_id` links a location to its owning tenant/sub-tenant. Null for single-brand branches.
- `brand_override` allows franchisees to customize colors, logo, name within platform limits.
- `royalty_percent` enables platform fee collection on franchisee revenue.
- `settlement_account` stores payout/bank details for franchisee settlements.

### 2.2 Restaurant Vertical: Add `locationId`

Add `locationId` (nullable) to:
- `tables`
- `reservations`
- `payments`
- `customers`

Migration seeds existing single-location restaurants with a default location derived from tenant settings or a new "Main" location auto-created per tenant.

### 2.3 Franchisee Isolation Layer

Introduce a `franchise_agreements` table for franchise-specific contracts:
```sql
CREATE TABLE franchise_agreements (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  tenant_id INTEGER NULL, -- platform tenant (null for platform-owned)
  franchisee_id INTEGER NOT NULL, -- sub-tenant or user acting as franchisee
  location_id INTEGER NOT NULL,
  agreement_start DATE,
  agreement_end DATE,
  royalty_percent DECIMAL(5,2),
  terms JSON,
  status ENUM('active','suspended','terminated') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 3. Tenant & Location Associations

### 3.1 Update Tenant Model

```js
Tenant.hasMany(Location, { foreignKey: "tenantId", as: "locations" });
Location.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
```

### 3.2 Franchisee as Sub-Tenant vs. Dedicated Entity

Two options:

| Option | Description | Trade-off |
|---|---|---|
| **A: Sub-tenant** | Franchisee is a `Tenant` record with `parent_tenant_id` pointing to the platform/master tenant | Reuses existing tenant auth/billing; requires soft multi-tenancy in queries |
| **B: Dedicated franchisee table** | `Franchisee` model with its own auth + billing profile | Cleaner isolation; more schema + auth work |

**Recommended: Option A** — reuse `Tenant` with a `parent_tenant_id` self-reference. This keeps the existing multi-tenant auth/billing stack intact and only adds a scoping rule: queries for franchisee data filter by `Tenant.id`, while master-tenant queries optionally aggregate across children.

---

## 4. RBAC & Access Control

### 4.1 New Permissions

| Permission | Single-Brand | Franchise |
|---|---|---|
| `manage_locations` | Admin can CRUD all branches | Master admin can CRUD franchisee locations; franchisee admin can CRUD own only |
| `view_cross_location` | Yes — see all branches | Master admin yes; franchisee admin no (own locations only) |
| `manage_franchisees` | No | Platform super-admin only |
| `view_franchise_analytics` | No | Master admin + platform super-admin |

### 4.2 Location Switcher

- Existing location switcher UI (if any) extends to support:
  - **Single-brand:** switch between branches (full access)
  - **Franchise:** switch between own locations only; no visibility into other franchisees

### 4.3 Query Scoping

All location-scoped queries must filter by:
1. `tenantId` (existing)
2. `locationId` (new for restaurant vertical)
3. For franchisees: additionally filter by `franchisee_id` or `parent_tenant_id` chain

Super-admin / platform admin retains cross-location visibility via explicit permission checks.

---

## 5. Billing & Royalties

### 5.1 Single-Brand Branches

- One subscription plan per master tenant.
- All locations share the same plan limits.
- Revenue aggregated across branches for billing.

### 5.2 Franchise Model

- Each franchisee tenant has its own subscription plan.
- Platform charges franchisee directly.
- Royalty percent tracked in `franchise_agreements` and enforced at:
  - Payment webhook (split/transfer on receipt)
  - End-of-day settlement job (BullMQ cron)
  - Invoice generation

### 5.3 Settlement Flow

```
Payment received → Paystack webhook → 
  If franchise: create split transfer to franchisee account (net of royalty)
  Else: credit master tenant account
```

Implementation: extend existing Paystack `buildSplitConfig()` to check `location.franchisee_id` and apply `royalty_percent`.

---

## 6. Reporting

### 6.1 Single-Brand

- Existing cross-location dashboard extends to restaurant vertical.
- Filters: date range, location, branch group.
- Aggregation: sum across branches with drill-down.

### 6.2 Franchise

- Franchisee sees only own locations.
- Master admin sees per-franchisee rollups (no cross-franchisee aggregation unless master explicitly opts in).
- Royalty report: per-franchisee revenue, royalty owed, settlement status.

### 6.3 Restaurant Vertical Gap

Restaurant currently has no location-scoped reporting. Add `locationId` to reservation/payment queries and extend `report.controller.js` to support `?locationId=` filter.

---

## 7. Implementation Order

### Phase 1: Schema Foundation
1. Add `location_type`, `franchisee_id`, `brand_override`, `royalty_percent`, `settlement_account` to `locations`.
2. Add `locationId` to restaurant `tables`, `reservations`, `payments`, `customers`.
3. Add `parent_tenant_id` to `tenants` (nullable self-ref).
4. Create `franchise_agreements` table.
5. Run migrations with idempotent backfill: auto-create "Main" location for tenants without one.

### Phase 2: Backend Scoping
1. Update all restaurant DAOs to filter by `locationId` when present.
2. Add franchisee-aware query scoping middleware.
3. Extend Paystack split logic for royalty calculation.
4. Add franchisee CRUD endpoints (platform super-admin only).
5. Update RBAC permission checks for cross-location access.

### Phase 3: Frontend
1. Add location/branch switcher to restaurant tenant views.
2. Extend cross-location dashboard to restaurant vertical.
3. Add franchisee management view for platform super-admin.
4. Per-location branding overrides in tenant settings.

### Phase 4: Hardening
1. Audit all raw SQL queries for missing `locationId` scoping.
2. Add integration tests for cross-branch isolation.
3. Add franchisee settlement reconciliation tests.
4. Verify single-location tenants are unaffected by schema changes.

---

## 8. STOP Conditions

- Do NOT allow cross-franchisee data leakage — franchisee queries must be scoped to own locations.
- Do NOT break existing single-location tenants — all new columns nullable, backfilled with defaults.
- Do NOT change restaurant reservation/payment flows until `locationId` scoping is fully tested.
- Do NOT implement franchise billing without explicit legal/finance sign-off on royalty terms.

---

## 9. Open Questions for Product

1. Should franchisees have completely independent branding, or must they maintain platform brand guidelines?
2. What is the royalty model — percent of revenue, flat fee, or tiered?
3. Can a franchisee own multiple locations, or is it one franchisee = one location?
4. Should platform super-admin be able to impersonate a franchisee for support?
5. What happens to existing salon location data when `location_type` is added — default all to `'branch'`?
