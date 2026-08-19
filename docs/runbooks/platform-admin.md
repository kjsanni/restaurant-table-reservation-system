# Platform Admin Runbooks

## Tenant Lookup

1. Open Super Admin Overview
2. Use tenant switcher search (supports slug/name)
3. Click tenant to open detail view

## Subscription Changes

1. Open tenant detail → Subscription tab
2. Click "Change Plan"
3. Select new plan — system prorates billing via Paystack
4. Feature flags update immediately

## Compliance Review

1. Open Compliance Dashboard
2. Filter by `legal_acceptances` version mismatches
3. Send reminder via in-app notification + email

## System Health

1. Open Monitoring → Health
2. Check: Redis connection, BullMQ queue depths, cron lock status, cache hit rate
3. If queue depth > 1000: scale provisioning worker via PM2

## Emergency Break-Glass

1. Navigate to `/admin/break-glass`
2. Require TOTP + second super-admin approval
3. Elevated session logged to immutable audit trail
