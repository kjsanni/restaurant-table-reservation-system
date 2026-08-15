# Change Management Runbook

## 1. Change Classification

| Class | Examples | Approval | Notification |
|-------|----------|----------|--------------|
| P0 — Critical | Security patches, payment fixes, data-loss fixes | CTO + on-call lead | Immediate tenant email/SMS |
| P1 — High | Backend schema, API contract, auth flow | Platform lead | 24h tenant notice |
| P2 — Medium | Feature flags, UI polish, reports | Engineering manager | Release notes + in-app banner |
| P3 — Low | Docs, typos, internal tooling | Self-approved | Changelog only |

## 2. Maintenance Windows

- **Default window:** Sundays 02:00–04:00 GMT (lowest reservation volume).
- **Emergency window:** Any time with CTO approval + on-call rotation.
- **Procedure:**
  1. Open maintenance banner via `POST /api/v1/admin/maintenance` with `enabled: true`.
  2. Queue tenant notification email/SMS via notification worker.
  3. Deploy during window.
  4. Verify `/api/v1/health` and queue depths.
  5. Disable maintenance banner + send all-clear notification.

## 3. Deprecation Timeline

1. **Announce** — Add banner in affected UI + email/SMS to tenants.
2. **Warn** — API returns `Deprecation` header + `warning` field for 30 days.
3. **Disable** — Feature flag turned off; feature returns `410 Gone` or empty state.
4. **Remove** — Code and docs removed in next sprint.

## 4. Rollback Criteria

Roll back immediately when:
- Error rate > 5% for any tenant group.
- Database connection pool saturation > 80%.
- Queue failure rate > 2%.
- Tenant support tickets spike > 3x baseline.

## 5. Tenant Communication Templates

- **Maintenance:** "We’ll be performing maintenance on [date] from [time] GMT. Reservations may be briefly unavailable."
- **Deprecation:** "Feature X will be retired on [date]. Please migrate to Y before then."
- **Incident:** "We’re investigating reports of [issue]. Updates will follow every 30 minutes."
