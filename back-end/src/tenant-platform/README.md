# Tenant Platform Module

Multi-tenant SaaS extension for the Restaurant Table Reservation System (RTRS).

## Activation

Set `TENANT_MODE=enabled` in the backend environment. When disabled or unset, the module is completely inert and the system behaves as single-tenant.

## What it provides

- **Tenant model** with Paystack billing fields and subscription lifecycle
- **Tenant resolution** from subdomain, `X-Tenant-Id`, or `X-Tenant-Slug` headers
- **Subscription gate** middleware that blocks suspended / past-due / cancelled tenants
- **Paystack service wrapper** for charges, subscriptions, plans, and webhooks
- **Platform admin API** for tenant CRUD, enable/disable, and dashboard stats
- **Frontend dashboard** (`/admin/tenants`) and detail view (`/admin/tenants/:id`)
- **Scheduled cron** that suspends past-due tenants after grace period expiry

## Directory layout

```
back-end/src/tenant-platform/
  middleware/
    resolveTenant.js
    tenantStatus.js
  models/
    tenant.js
  services/
    tenantSubscription.service.js
    paystack.service.js
  controllers/
    billing.controller.js
    tenantAdmin.controller.js
  routes/
    billing.router.js
    tenantAdmin.router.js
  utils/
    tenantCron.js
```

## Database

- New table: `tenants`
- New columns: `tenantId` on all existing data tables (nullable until backfilled)
- Migration order:
  1. `create-tenants`
  2. `add-tenant-id-to-tables`
  3. `backfill-default-tenant`
  4. Subscription fields are included in `create-tenants`

## Environment variables

| Variable | Purpose |
|---|---|
| `TENANT_MODE` | Set to `enabled` to activate the module |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for API calls |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature verification secret |
| `PAYSTACK_MODE` | `test` or `live` |

## Frontend

Routes are only registered when `VITE_TENANT_MODE === 'enabled'`:
- `/admin/tenants`
- `/admin/tenants/:id`

API client: `front-end/src/services/tenantAdminAPI.js`

## Subscription plans

Seeded in `PLANS` constant inside `tenantSubscription.service.js`:
- `starter`: GHS 29/mo, 10 tables, 500 reservations/mo
- `growth`: GHS 79/mo, 30 tables, 2000 reservations/mo
- `enterprise`: Custom pricing, unlimited

Default currency is **GHS**.
