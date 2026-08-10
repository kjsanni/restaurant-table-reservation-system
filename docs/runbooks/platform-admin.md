# Platform Admin Runbooks

## Tenant Lookup

1. Open Super Admin → Tenants.
2. Use search by name or slug.
3. Filter by status (`active`, `suspended`, `past_due`, `cancelled`).
4. Click tenant to view details and activity log.

## Subscription Changes

1. Select tenant → Subscription tab.
2. Change plan: update `plan` field.
3. Manually extend grace: set `graceEndsAt`.
4. Log action in platform audit trail.

## Compliance Review

1. Open Super Admin → Compliance.
2. Review `legalAcceptances` for missing signatures.
3. Check `dataRetentionPolicy` alignment.
4. Export compliance evidence for auditors.

## Incident Response

1. Open Super Admin → Incidents.
2. Lock tenant if abuse is detected (`POST /admin/incidents/:id/lock-tenant`).
3. Reset tenant tokens if credentials are compromised.
4. Force logout if session hijacking is suspected.
