# ERPNext v15 Integration — Implementation Plan

> [!abstract] Headless ERP Backbone for RTRS
> Integrates ERPNext v15 as a provisionable back-office ERP engine for both restaurant and salon verticals. Super-admin enables ERPNext modules per tenant via feature flags; tenant portal surfaces ERPNext data as native Vue panels. ERPNext is never the primary UX — RTRS remains the reservation-first single pane of glass.

> [!info] Why v15
> Current stable baseline with mature REST API, full accounting/stock/HR/CRM modules, and stable DocType schemas. v16's improvements (custom financial templates, consolidated trial balance, ~2x performance) are desirable but not blocking; the integration layer will be version-agnostic via adapters.

---

## Architecture Decision

**API-first, loosely coupled.** RTRS and ERPNext do not share a database. Communication happens over REST API + webhooks, mediated by a sync layer inside `back-end/src/integrations/erpnext/`.

```
RTRS (Node/Express/MySQL)              ERPNext v15 (Python/MariaDB)
┌──────────────────────────┐           ┌──────────────────────────┐
│ Restaurant vertical      │◄─────────►│ Accounting               │
│  - Reservations          │  REST API │  - Sales/Purchase Invoices│
│  - Floor plans           │           │  - General Ledger        │
│  - Waitlist              │           │  - Payments              │
│  - WhatsApp orders       │           │  - Tax / GHS compliance  │
├──────────────────────────┤           ├──────────────────────────┤
│ Salon vertical           │◄─────────┤ Stock / Inventory        │
│  - Appointments          │           │  - Items (products)      │
│  - Stylist stations      │           │  - Stock Ledger          │
│  - Client tiers          │           │  - Stock Reservation     │
│  - Gift cards            │           │  - Warehouses            │
├──────────────────────────┤           ├──────────────────────────┤
│ Tenant platform          │◄─────────┤ HR / Payroll             │
│  - Feature flags         │           │  - Employees             │
│  - Subscription/billing  │           │  - Attendance/Leave      │
└──────────────────────────┘           │  - Salary Slips          │
         ▲                              └──────────────────────────┘
         │ Webhooks / REST                       ▲
         │                                       │
         │         Sync Layer (Node.js)          │
         └───────────────────────────────────────┘
                          │
                   ┌──────▼──────┐
                   │ RTRS Front  │
                   │ (Vue 3)     │
                   │ Unified UX  │
                   └─────────────┘
```

**Key principle:** ERPNext is the system of record for back-office data (invoices, inventory, employees). RTRS is the system of record for front-office data (reservations, appointments, floor plans). The sync layer flows data from RTRS → ERPNext; tenant-facing ERPNext views are read-only proxies.

---

## Tenant Portal Integration Model

### Super-admin provisions ERPNext modules per tenant

Super-admin opens `TenantDetailView.vue` → sees **ERPNext Modules** card → toggles modules on/off. Each toggle writes a flag to `tenant.settings.featureFlags`:

```json
{
  "erpnext_accounting": true,
  "erpnext_stock": true,
  "erpnext_crm": false,
  "erpnext_hr": false,
  "erpnext_pos": false,
  "erpnext_manufacturing": false
}
```

### Plan entitlements gate provisioning

Each `subscriptionPlan` declares allowed ERPNext modules:

| Plan | Allowed ERPNext Modules |
|------|------------------------|
| `starter` | None |
| `growth` | `erpnext_accounting`, `erpnext_crm` |
| `enterprise` | All modules |

Super-admin cannot enable modules the tenant's plan doesn't include.

### Tenant portal auto-reveals ERPNext views

The existing `getTenantCapabilitiesHandler` returns all `featureFlags`. The existing `requiresFeature` sidebar mechanism hides/shows nav items. New ERPNext nav items simply declare `requiresFeature: 'erpnext_accounting'`, etc.

Tenant sees:
- **Sidebar:** new "Accounting", "Inventory", "CRM", "Staff Records" items appear when flags are enabled
- **Dashboard:** ERPNext summary cards (revenue, inventory value, low-stock count) appear when flags are enabled
- **Settings:** read-only ERPNext configuration section (company name, warehouse, sync status)

### ERPNext views are thin Vue wrappers over RTRS proxy APIs

Tenants never access ERPNext directly. Each ERPNext view calls a RTRS backend proxy that:
1. Validates the tenant's ERPNext feature flag
2. Calls ERPNext's REST API using a shared service account (or per-tenant API key)
3. Maps ERPNext DocTypes to tenant-friendly JSON
4. Returns data to the Vue view

---

## ERPNext Onboarding Workflow Integration

### Problem
ERPNext has its own onboarding wizard (company setup, chart of accounts, warehouse creation, employee import, etc.). If a tenant has ERPNext modules enabled, they need this wizard completed before ERPNext data is meaningful.

### Solution: Conditional Onboarding Steps in RTRS

The existing `TenantSetupWizardView.vue` already branches based on `businessVertical` and `restaurantType`. Extend it to branch on `erpnext_*` flags.

**When any `erpnext_*` flag is enabled for a tenant, the RTRS onboarding wizard appends ERPNext-specific steps:**

| Step | Trigger Flag | ERPNext Action | RTRS UI |
|------|-------------|----------------|---------|
| 8A | `erpnext_accounting` or `erpnext_stock` | Create ERPNext Company matching tenant name | "Set up your ERP accounting" — confirm company name, currency (GHS), fiscal year start |
| 8B | `erpnext_stock` | Create default Warehouse | "Set up your warehouse" — name, address |
| 8C | `erpnext_hr` | Import existing staff into ERPNext Employee | "Import staff records" — map RTRS staff to ERPNext employees |
| 8D | `erpnext_manufacturing` | Create default BOM categories | "Set up recipes / BOM" — confirm item groups |

**Implementation approach:**

1. **RTRS onboarding wizard** (`TenantSetupWizardView.vue`) reads `erpnext_*` flags from the tenant's capabilities
2. For each enabled module, it renders the corresponding ERPNext setup step
3. Each step calls a RTRS backend endpoint (`POST /api/v1/onboarding/erpnext/company`, etc.)
4. Backend endpoint calls ERPNext's REST API to create the Company/Warehouse/Employee
5. On completion, the wizard marks the ERPNext onboarding step as done in `tenant.settings.erpnextOnboardingStatus`
6. Tenant's ERPNext dashboard panels remain disabled/placeholder until onboarding is complete

**Alternative: Direct ERPNext portal redirect**

For enterprise tenants with complex ERPNext needs, offer a "Complete ERPNext setup" button that opens ERPNext's own portal in an iframe or new tab, pre-authenticated via SSO token. This is **Phase 2** — v1 keeps everything inside RTRS.

---

## Implementation Plan

### Phase 0: Foundation (Week 1)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 0.1 | Add `erpnext_*` feature flags to `TYPE_DEFAULTS` | `back-end/src/tenant-platform/services/tenantTypeDefaults.service.js` | `npm test` — tenant defaults tests pass |
| 0.2 | Create ERPNext module registry (flag → module metadata) | `back-end/src/integrations/erpnext/module-registry.js` | Module registry exports correct dependencies |
| 0.3 | Create ERPNext REST API client with token auth, retry, idempotency | `back-end/src/integrations/erpnext/client.js` | Client can auth against ERPNext v15 sandbox |
| 0.4 | Add `erpnextModules` to `subscriptionPlan` model + migration | `back-end/src/tenant-platform/models/subscriptionPlan.js` | Plan CRUD includes `erpnextModules` JSON |
| 0.5 | Update `updateTenantFeatureFlagsHandler` to enforce plan entitlements + dependencies | `back-end/src/tenant-platform/controllers/featureFlag.controller.js` | 403 returned when plan doesn't include module |

### Phase 1: Customer & Invoice Sync (Weeks 2–3)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 1.1 | Map RTRS customer → ERPNext Customer | `back-end/src/integrations/erpnext/mappers/customer.mapper.js` | Manual test: create RTRS customer → ERPNext Customer created |
| 1.2 | Map RTRS reservation/appointment → ERPNext Sales Invoice | `back-end/src/integrations/erpnext/mappers/invoice.mapper.js` | Restaurant reservation + salon appointment both create invoices |
| 1.3 | Create customer sync job | `back-end/src/integrations/erpnext/sync/customer.sync.js` | Idempotent: retry doesn't duplicate |
| 1.4 | Create invoice sync job | `back-end/src/integrations/erpnext/sync/invoice.sync.js` | Invoice appears in ERPNext with correct items/taxes |
| 1.5 | Create payment reconciliation sync | `back-end/src/integrations/erpnext/sync/payment.sync.js` | Paystack payment → ERPNext Payment Entry |
| 1.6 | Add proxy endpoints for tenant-facing ERPNext views | `back-end/src/integrations/erpnext/proxies/*.js` | Tenant portal Accounting view loads P&L |
| 1.7 | Add ERPNext nav items to `sidebarItems.ts` | `front-end/src/config/sidebarItems.ts` | Items appear/disappear based on flags |
| 1.8 | Create `ErpnextAccountingView.vue` | `front-end/src/views/tenant/ErpnextAccountingView.vue` | Shows P&L, invoices, payments |

### Phase 2: Inventory & Stock Sync (Weeks 4–5)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 2.1 | Map RTRS salon inventory item → ERPNext Item | `back-end/src/integrations/erpnext/mappers/item.mapper.js` | Salon inventory item syncs to ERPNext |
| 2.2 | Map RTRS restaurant ingredient → ERPNext Item | Same mapper, different item group | Restaurant ingredient syncs to ERPNext |
| 2.3 | Create item sync job | `back-end/src/integrations/erpnext/sync/item.sync.js` | Item created/updated in ERPNext |
| 2.4 | Create stock entry sync (sales, adjustments) | `back-end/src/integrations/erpnext/sync/stock-entry.sync.js` | Stock ledger reflects RTRS movements |
| 2.5 | Add proxy endpoints for inventory views | `back-end/src/integrations/erpnext/proxies/inventory.proxy.js` | Tenant portal Inventory view loads stock levels |
| 2.6 | Create `ErpnextInventoryView.vue` | `front-end/src/views/tenant/ErpnextInventoryView.vue` | Shows items, stock levels, low-stock alerts |

### Phase 3: ERPNext Onboarding Workflow (Week 6)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 3.1 | Add ERPNext onboarding steps to `TenantSetupWizardView.vue` | `front-end/src/views/TenantSetupWizardView.vue` | Steps appear when `erpnext_*` flags are enabled |
| 3.2 | Create onboarding endpoints (company, warehouse, employee import) | `back-end/src/integrations/erpnext/onboarding/*.js` | ERPNext Company/Warehouse created via API |
| 3.3 | Add `erpnextOnboardingStatus` to tenant settings | `back-end/src/tenant-platform/models/tenant.js` | Onboarding progress persisted |
| 3.4 | Gate ERPNext dashboard panels on onboarding completion | `front-end/src/views/TenantLandingView.vue` | Panels show placeholder until onboarding done |

### Phase 4: Staff/HR & CRM Sync (Weeks 7–8)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 4.1 | Map RTRS staff → ERPNext Employee | `back-end/src/integrations/erpnext/mappers/employee.mapper.js` | Staff syncs to ERPNext |
| 4.2 | Create employee sync job | `back-end/src/integrations/erpnext/sync/employee.sync.js` | One-way sync, ERPNext owns payroll |
| 4.3 | Map RTRS customer → ERPNext Lead/Customer (CRM) | `back-end/src/integrations/erpnext/mappers/crm.mapper.js` | Customer lifecycle tracked in ERPNext CRM |
| 4.4 | Create CRM sync job | `back-end/src/integrations/erpnext/sync/crm.sync.js` | Lead source, campaigns synced |
| 4.5 | Add proxy endpoints for HR/CRM views | `back-end/src/integrations/erpnext/proxies/hr.proxy.js`, `crm.proxy.js` | Tenant portal HR/CRM views load data |
| 4.6 | Create `ErpnextEmployeesView.vue` and `ErpnextCrmView.vue` | `front-end/src/views/tenant/ErpnextEmployeesView.vue`, `ErpnextCrmView.vue` | Staff list, attendance, customer list visible |

### Phase 5: Super-admin Provisioning UI (Week 9)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 5.1 | Add ERPNext Modules card to `TenantDetailView.vue` | `front-end/src/views/admin/TenantDetailView.vue` | Toggles visible, save persists flags |
| 5.2 | Add ERPNext module column to `TenantDashboardView.vue` | `front-end/src/views/admin/TenantDashboardView.vue` | Quick overview of which tenants have ERPNext |
| 5.3 | Add ERPNext provisioning to bulk actions | `back-end/src/tenant-platform/controllers/bulkAction.controller.js` | Bulk assign ERPNext modules to tenants |
| 5.4 | Add `erpnextModules` to plan editor | `front-end/src/views/admin/PlansManagementView.vue` | Plan form includes ERPNext module checkboxes |

### Phase 6: Ghana Compliance & Reporting (Week 10)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 6.1 | Configure Ghana tax templates in ERPNext (NHIL, GETFund, Covid levy) | ERPNext admin (manual + scripted) | Invoices show correct Ghana tax breakdown |
| 6.2 | Create Ghana P&L and balance sheet proxy endpoints | `back-end/src/integrations/erpnext/proxies/reports.proxy.js` | Tenant can view Ghana-compliant financial statements |
| 6.3 | Add ERPNext summary cards to tenant dashboard | `front-end/src/views/TenantLandingView.vue` | Revenue, inventory value, low-stock shown |

### Phase 7: v15 → v16 Upgrade Adapter (Week 11)

| # | Task | File(s) | Verification |
|---|------|---------|-------------|
| 7.1 | Create adapter interface (`adapter-factory.js`) | `back-end/src/integrations/erpnext/adapters/` | Swaps v15/v16 implementations |
| 7.2 | Implement v15 adapter (default) | `back-end/src/integrations/erpnext/adapters/v15.js` | All current calls use v15 adapter |
| 7.3 | Implement v16 adapter | `back-end/src/integrations/erpnext/adapters/v16.js` | v16-specific URL/field mappings |
| 7.4 | Dry-run v15 → v16 migration in sandbox | ERPNext bench | All sync jobs pass against v16 |

---

## File Tree (New Files)

```
back-end/src/integrations/erpnext/
├── client.js                          # HTTP client, auth, retry, idempotency
├── module-registry.js                 # flag → module metadata + dependencies
├── adapter-factory.js                 # version detection + adapter loading
├── adapters/
│   ├── v15.js                         # v15-specific API mappings
│   └── v16.js                         # v16-specific API mappings
├── mappers/
│   ├── customer.mapper.js             # RTRS customer → ERPNext Customer
│   ├── invoice.mapper.js              # RTRS reservation/appt → ERPNext Sales Invoice
│   ├── payment.mapper.js              # RTRS payment → ERPNext Payment Entry
│   ├── item.mapper.js                 # RTRS inventory → ERPNext Item
│   ├── stock-entry.mapper.js          # RTRS stock movement → ERPNext Stock Entry
│   ├── employee.mapper.js             # RTRS staff → ERPNext Employee
│   └── crm.mapper.js                  # RTRS customer → ERPNext Lead/Customer
├── sync/
│   ├── customer.sync.js               # Customer creation/update job
│   ├── invoice.sync.js                # Invoice creation on completion
│   ├── payment.sync.js                # Payment reconciliation
│   ├── item.sync.js                   # Item master sync
│   ├── stock-entry.sync.js            # Stock movement sync
│   ├── employee.sync.js               # Staff sync (one-way)
│   ├── crm.sync.js                    # CRM sync
│   └── orchestrator.js                # Activates/deactivates jobs per tenant
├── proxies/
│   ├── accounting.proxy.js            # P&L, balance sheet, invoices
│   ├── inventory.proxy.js             # Stock levels, valuation, movements
│   ├── hr.proxy.js                    # Staff, attendance, payroll
│   ├── crm.proxy.js                   # Customers, leads, campaigns
│   └── reports.proxy.js               # Financial reports (Ghana-specific)
└── onboarding/
    ├── company.js                     # Create ERPNext Company
    ├── warehouse.js                   # Create default Warehouse
    ├── employee.js                    # Import staff as ERPNext Employees
    └── orchestrator.js                # Runs onboarding steps for enabled modules
```

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `TENANT_MODE` + `resolveTenant` | ✅ Existing | All ERPNext sync jobs are tenant-scoped |
| `tenant.settings.featureFlags` | ✅ Existing | ERPNext modules stored as boolean flags |
| Super-admin feature flag UI | ✅ Existing | `FeatureFlagsView.vue` + `TenantDetailView.vue` |
| Plan system | ✅ Existing | `subscriptionPlan` + `tenantSubscription.service.js` |
| BullMQ job queue | ✅ Existing | Sync jobs run as BullMQ jobs with retry/DLQ |
| Redis caching | ✅ Existing | ERPNext API responses cached per tenant |
| Paystack webhook infrastructure | ✅ Existing | Pattern for ERPNext webhooks |
| `getTenantCapabilitiesHandler` | ✅ Existing | Returns all feature flags to frontend |
| `requiresFeature` sidebar mechanism | ✅ Existing | Auto-hides ERPNext nav items when flag is off |

---

## Open Questions

1. **ERPNext deployment model:** Shared instance (one ERPNext with Companies per tenant) vs. per-tenant bench/site? Recommendation: shared instance for v1, per-tenant only if explicitly demanded.
2. **ERPNext authentication:** Shared service account API key vs. per-tenant API key? Shared account is simpler; per-tenant keys offer better isolation.
3. **Sync direction:** RTRS → ERPNext only (recommended for v1) vs. bidirectional? Bidirectional adds conflict resolution complexity.
4. **ERPNext company naming:** Should ERPNext Company name match tenant name exactly, or allow tenant customization during onboarding?
5. **Onboarding timing:** Should ERPNext onboarding happen during initial RTRS tenant creation, or only when the first ERPNext module is enabled by super-admin?
6. **v16 upgrade timing:** Build adapter now and upgrade immediately, or build against v15 and upgrade later? Recommendation: build against v15, adapter-ready, upgrade in Phase 7.

---

## Non-Goals (Out of Scope)

- Replacing RTRS reservation/scheduling engine with ERPNext
- Embedding ERPNext Desk UI in iframes
- Per-tenant ERPNext customizations (Frappe custom apps)
- ERPNext as the customer-facing portal
- Real-time bidirectional sync (ERPNext → RTRS mutations)
