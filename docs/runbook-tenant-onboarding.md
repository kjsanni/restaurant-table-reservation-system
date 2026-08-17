# Runbook: Tenant Onboarding

**Runbook ID:** ONB-001  
**Version:** 1.0  
**Last updated:** 2026-08-12  
**Audience:** Platform Super-Admin, Support Staff  

---

## Overview

This runbook covers the standard procedure for onboarding a new restaurant or
salon tenant onto the multi-tenant platform. Onboarding includes: tenant
profile creation, vertical selection (restaurant vs salon), billing setup,
feature flag assignment, and initial admin user provisioning.

**Expected duration:** 15–30 minutes (self-service via admin UI; 5 min for bulk imports)

---

## Prerequisites

- Super-admin access to the Platform Admin portal
- Tenant data: name, slug, business vertical (restaurant/salon), contact email
- Subscription plan details (if applicable)
- For salons: WhatsApp Business number, ShaQ Express API credentials
- For restaurants: Paystack settlement account details

---

## Step-by-Step Procedure

### Step 1: Create Tenant Record

**Via Admin UI:**
1. Navigate to `/super-admin/tenants`
2. Click **New Tenant**
3. Fill form: name, slug, vertical (restaurant or salon)
4. Click **Save**

**Via API:**
```bash
curl -X POST https://api.rtrs.io/admin/tenants \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bistro Jem", "slug": "bistro-jem", "businessVertical": "restaurant"}'
```

**Verification:** Tenant appears in the tenant list with status `pending_setup`.

### Step 2: Assign Subscription Plan

1. Navigate to `/super-admin/tenants/{id}/billing`
2. Click **Assign Plan**
3. Select plan: `starter`, `growth`, or `enterprise`
4. Set billing cycle and payment method
5. Click **Activate**

**API alternative:**
```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/subscribe \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"plan": "growth", "paymentMethod": "manual"}'
```

**Verification:** Tenant status changes to `active`.

### Step 3: Configure Vertical-Specific Settings

#### Restaurant:
1. Configure Paystack integration: `POST /admin/tenants/{id}/integrations/paystack`
2. Set opening hours: `PATCH /admin/tenants/{id}/settings`
3. Import floor plan (optional): `POST /admin/tenants/{id}/floorplan`

#### Salon:
1. Configure WhatsApp Business: `POST /admin/tenants/{id}/integrations/whatsapp`
2. Configure ShaQ Express delivery: `POST /admin/tenants/{id}/integrations/delivery`
3. Enable stylist commissions (feature flag): `PATCH /admin/feature-flags/tenants/{id}`

**Verification:** Integration status shows `connected` in the integrations tab.

### Step 4: Provision Admin User

1. Navigate to `/super-admin/tenants/{id}/users`
2. Click **Invite Admin**
3. Enter: name, email, phone number
4. Click **Send Invite**

The admin receives an email with an invite link. They set their password and
complete their profile.

**Verification:** Admin user appears with `role: admin` and `status: active`.

### Step 5: Run Onboarding Checklist

1. Navigate to `/super-admin/tenants/{id}/onboarding`
2. Complete checklist items:
   - [ ] Brand customization (logo, colors)
   - [ ] First reservation table configured
   - [ ] Staff members added
   - [ ] Opening hours set
   - [ ] Payment integration verified

**Verification:** Onboarding status = `complete`.

### Step 6: Post-Onboarding Validation

Run the platform health check:
```bash
node scripts/tenant-health-check.js {tenant-id}
```

This verifies:
- Database connection
- Redis cache
- Paystack webhook endpoint
- WhatsApp API connectivity
- Email delivery

**Verification:** All checks return `OK`.

---

## Bulk Onboarding (10+ tenants)

For 10+ tenants, use the CSV import flow:

1. Download template: `GET /admin/tenants/template`
2. Fill CSV with tenant data
3. Upload: `POST /admin/tenants/import`
4. Monitor job: `GET /admin/tenants/import/{job-id}`
5. Review results: `GET /admin/tenants/import/{job-id}/report`

**Verification:** CSV report shows 0 failed rows.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Tenant not appearing in list | Cache not invalidated | Run `redis-cli DEL "tenants:all"` |
| Onboarding stuck at "in progress" | Background job failed | Check `bullmq` queue: `node scripts/queue-inspect.js` |
| Admin invite email not received | SMTP misconfigured | Check `back-end/.env` SMTP settings; test with `node scripts/test-smtp.js` |
| Paystack integration failing | API key not set | Verify key in `back-end/.env`, re-save via `/admin/tenants/{id}/integrations/paystack` |
| WhatsApp connection refused | Business API not provisioned | Verify phone number registered in Meta Business Manager |

---

## Escalation

| Issue | Escalation path |
|-------|-----------------|
| Integration errors | `#integrations` Slack channel, @platform-integrations |
| Billing issues | `#billing-ops` Slack channel, @billing-team |
| Data issues (DSAR, export) | `#data-compliance` Slack channel, @legal-team |
| Critical system outage | `oncall@rtrs.io` (page via PagerDuty) |

---

## Rollback Procedure

If onboarding causes a critical issue:
1. Suspend tenant: `POST /admin/tenants/{id}/disable`
2. Document the issue in `docs/incidents/YYYY-MM-DD-onboarding-{slug}.md`
3. Restore previous state: `POST /admin/tenants/{id}/restore` (uses soft-deleted record)

**Note:** Tenant data is never hard-deleted. Use `POST /admin/tenants/{id}/anonymize`
only after legal approval (DSAR compliance).
