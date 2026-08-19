# Tenant Onboarding Runbook

## Prerequisites

- Tenant signed up and paid via Paystack
- Super-admin approved tenant in portal
- Domain/DNS configured (if custom domain)

## Steps

1. **Provision tenant**
   - Super-admin creates tenant via `POST /api/v1/admin/tenants`
   - System enqueues provisioning job (BullMQ)

2. **Seed data**
   - Default staff roles created
   - Vertical-specific settings seeded (salon / restaurant / event)
   - Legal acceptance versions initialized

3. **Enable modules**
   - Super-admin enables ERPNext modules via `POST /api/v1/admin/erpnext/tenants/:id/provision`
   - Feature flags set per plan limits

4. **Verify**
   - Tenant can log in at `/{tenantSlug}.vibespot.com`
   - First reservation / appointment can be created
   - WhatsApp Business API configured (if enabled)

5. **Go-live**
   - Send welcome email/SMS to tenant admin
   - Mark tenant `status: "active"` in monitoring dashboard

## Rollback

- If provisioning fails: tenant remains `status: "pending"` — no customer impact.
- Re-queue provisioning job from admin UI.
