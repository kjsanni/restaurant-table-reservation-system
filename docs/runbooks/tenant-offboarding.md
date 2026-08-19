# Tenant Offboarding Runboard

## Prerequisites

- Tenant requested cancellation or subscription expired
- All outstanding invoices paid

## Steps

1. **Data export**
   - Export reservations, customers, payments, settings to JSON/CSV
   - Deliver to tenant via secure link (expires in 7 days)

2. **Suspend tenant**
   - Set `status: "suspended"` — blocks new reservations
   - Existing data remains readable for 30 days

3. **Archive**
   - Move tenant data to archive DB shard (or encrypted S3)
   - Remove from active tenant cache (`tenantCache.invalidatePattern`)

4. **Delete**
   - After 30 days: soft-delete tenant + cascade anonymize PII
   - Preserve audit logs for compliance (DPA 2012)

## Verification

- Confirm tenant cannot authenticate
- Confirm no cross-tenant data leakage in search/index
- Confirm billing stopped
