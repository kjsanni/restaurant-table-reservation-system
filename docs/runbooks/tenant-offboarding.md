# Tenant Offboarding Runbook

## 1. Data Export

- Tenant admin requests data export from tenant portal.
- System exports: reservations, customers, settings, legal acceptances.
- Export is delivered as JSON/CSV via secure download link.

## 2. Suspension

- Super-admin or automated cron suspends past-due tenants.
- Tenant status changes to `suspended`.
- All login attempts are rejected until payment is received.

## 3. Archival

- After 90 days of suspension, tenant data is anonymized.
- `anonymizeData` replaces PII with placeholder values.
- Audit log records anonymization timestamp and operator.

## 4. Deletion

- Tenant record is soft-deleted (`deletedAt` timestamp).
- Related records are cascade-deleted where safe.
- Hard delete is performed after retention period per legal policy.

## 5. Post-Offboarding

- [ ] Data export confirmed delivered
- [ ] Suspension reason documented
- [ ] Anonymization verified
- [ ] Billing cancelled
- [ ] Domain/DNS records removed if custom domain was used
