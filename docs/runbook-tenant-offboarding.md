# Runbook: Tenant Offboarding

**Runbook ID:** OFF-001  
**Version:** 1.0  
**Last updated:** 2026-08-12  
**Audience:** Platform Super-Admin, Data Protection Officer  

---

## Overview

This runbook covers the secure offboarding of a tenant from the multi-tenant
platform. Offboarding includes: data export, anonymization, billing termination,
and complete access revocation. All steps must be completed before a tenant
record is soft-deleted.

**⚠️ WARNING:** This procedure is irreversible for data that has been
anonymized. DSAR/legal approval is required before anonymization (see Step 4).

---

## Prerequisites

- Tenant ID or slug
- Legal clearance (if DSAR/compliance removal requested)
- Data export approval from tenant
- Billing final invoice status confirmed

---

## Step-by-Step Procedure

### Step 1: Initiate Offboarding Request

1. Navigate to `/super-admin/tenants/{id}/settings`
2. Click **Request Offboarding**
3. Enter reason: `churn`, `policy_violation`, `dsar_request`, or `migration`
4. Confirm with 2FA / TOTP

**Audit trail:** Action is logged in `legal_acceptances` table with timestamp
and reason.

### Step 2: Export Tenant Data (DSAR compliance)

```bash
# Generate export package
curl -X POST https://api.rtrs.io/admin/tenants/{id}/export \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"format": "json", "include": ["reservations", "customers", "payments", "staff"]}'

# Poll for completion
curl -H "Authorization: Bearer <TOKEN>" \
  https://api.rtrs.io/admin/tenants/{id}/export/{job-id}
```

**Verification:** Export job returns `status: complete` with download URL.
Archive the export to `s3://rtrs-exports/{tenant-id}/{timestamp}.zip` for
7-year retention (Ghana DPA 2012 requirement).

### Step 3: Terminate Billing

1. Navigate to `/super-admin/tenants/{id}/billing`
2. Click **Cancel Subscription**
3. Generate final invoice: `POST /admin/tenants/{id}/invoice/final`
4. Disable auto-renew: `PATCH /admin/tenants/{id}/billing` with `{ "autoRenew": false }`

**API alternative:**
```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/cancel \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"reason": "churn"}'
```

**Verification:** Tenant's `subscriptionStatus` = `cancelled`. Paystack
subscription disabled. No future charge attempts will occur.

### Step 4: Anonymization (Legal Requirement)

⚠️ **Requires DPO approval for DSAR requests.**

For standard churn: data is retained per Ghana DPA Act 843 Section 16(c)
(24-month retention).

For DSAR "right to erasure": 
1. Get written legal approval
2. Run anonymization:
```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/anonymize \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"erasePersonalData": true, "retainTransactionData": true}'
```
3. Verify anonymization report
4. Notify legal team

**Verification:** `GET /admin/tenants/{id}` returns `anonymized: true`.
Personal data fields (name, email, phone) are set to `NULL`. Transaction
data (amounts, timestamps) is retained for audit.

### Step 5: Revoke Access

1. **Disable all user accounts:**
```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/disable-all-users \
  -H "Authorization: Bearer <TOKEN>"
```

2. **Revoke API keys:**
```bash
curl -X DELETE https://api.rtrs.io/admin/api-keys/tenants/{id} \
  -H "Authorization: Bearer <TOKEN>"
```

3. **Remove from rate limiter allowlist:**
```bash
redis-cli SREM "tenant_allowlist" "{tenant-id}"
```

4. **Invalidate active sessions:**
```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/invalidate-sessions \
  -H "Authorization: Bearer <TOKEN>"
```

**Verification:** All tenant API keys return 401. WebSocket connections from
tenant subaccounts are dropped. Redis cache keys prefixed with `{tenant-id}`
are deleted.

### Step 6: Soft Delete Tenant Record

1. Navigate to `/super-admin/tenants/{id}/settings`
2. Click **Remove Tenant** (soft delete)
3. Enter confirmation code sent to super-admin email
4. Confirm

**API:**
```bash
curl -X DELETE https://api.rtrs.io/admin/tenants/{id} \
  -H "Authorization: Bearer <TOKEN>"
```

**Verification:** `GET /admin/tenants/{id}` returns `404`. Tenant appears in
**Deleted Tenants** view with `status: deleted`. Database record is marked
`deletedAt` (soft delete — reversible for 90 days).

### Step 7: Post-Offboarding Validation

```bash
# Run offboarding checklist script
node scripts/tenant-offboard-verify.js {tenant-id}
```

Checks:
- [✓] Data export completed and archived
- [✓] Billing cancelled, final invoice generated
- [✓] All user sessions invalidated
- [✓] API keys revoked
- [✓] Redis cache cleared
- [✓] Tenant marked as deleted in DB

**Verification:** Script outputs `VERIFICATION PASSED`.

---

## DSAR-Specific Flow

When the tenant is requesting data deletion under GDPR/Ghana DPA:

1. Verify identity via `docs/runbook-identity-verification.md`
2. Export data per Step 2 above
3. Obtain DPO legal approval (document in `legal_acceptances` table)
4. Run `POST /admin/tenants/{id}/anonymize` per Step 4
5. Log action in compliance audit trail

---

## Bulk Offboarding (10+ tenants)

For bulk churn (e.g., subscription plan downgrade affecting many tenants):

1. Identify tenants: `GET /admin/tenants?status=churned&limit=100`
2. Generate export batch: `POST /admin/tenants/export-batch`
3. Terminate billing: `POST /admin/tenants/cancel-batch`
4. Soft delete: `POST /admin/tenants/delete-batch`
5. Monitor batch job: `GET /admin/tenants/batch/{job-id}/status`

**Verification:** Batch report shows 0 failures. All exported data archived.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Export job stuck | Large data volume | Increase BullMQ job timeout: `node scripts/queue-config.js --timeout-export 3600` |
| Final invoice fails | Outstanding balance | Manually clear in Paystack dashboard, retry `POST /invoice/final` |
| Sessions not invalidated | Socket.IO server miss | Run `redis-cli KEYS "socket:sessions:{tenant-id}"` to find stale sessions |
| API keys still valid | Cache stale | Run `redis-cli FLUSHDB` on cache tier for the tenant's shard |
| Anonymization rejected | Missing DPO approval | Submit request via `#legal-request` Slack channel |

---

## Rollback Procedure

Tenant records are soft-deleted, not hard-deleted. To restore:

```bash
curl -X POST https://api.rtrs.io/admin/tenants/{id}/restore \
  -H "Authorization: Bearer <TOKEN>"
```

This restores:
- Tenant record (status → `active`)
- All user accounts (status → `active`, password reset required)
- Feature flag assignments
- Subscription (status → `past_due`)

**Note:** Anonymization is irreversible. If `anonymized: true`, restoration
returns the tenant record but with NULL personal data. A full data restore
requires recovery from the 24-month archive.

---

## Compliance References

- **Ghana DPA 2012 (Act 843), Section 16(c):** 24-month data retention for churned tenants
- **GDPR Article 17:** Right to erasure (requires DPO approval)
- **Paystack:** Subscription auto-cancel via Paystack API
- **Internal:** `legal_acceptances` table logs all offboarding actions
