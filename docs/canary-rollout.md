# Canary / Staged Rollout Process

## 1. Canary Tenant Selection

- Select 1–5 tenants for canary phase.
- Prefer tenants with: active subscription, low traffic volume, and existing support contact.
- Tag canary tenants in the platform database via `platformAudit` log: `canary_rollout:true`.

## 2. Feature Flag Promotion Workflow

1. **Deploy to canary** — Set feature flag scope to `canary` only.
2. **Monitor for 24h** — Check error rate, latency, queue depth, and tenant-reported issues.
3. **Promote to stable** — Update flag scope from `canary` → `stable`.
4. **Post-promotion health check** — Verify queue stats and database health for promoted tenants.

## 3. Rollback Triggers

Roll back immediately if any of the following occur within the monitoring window:

- Error rate exceeds 5% for the canary tenant group.
- Database connection pool saturation (>80% utilization).
- Queue failure rate exceeds 2%.
- Tenant support tickets spike by >3x baseline.

## 4. Rollback Runbook

### Backend

1. Revert feature flag to previous value.
2. Restart backend workers if migration was involved.
3. Verify `npm test` passes on reverted state.

### Frontend

1. Revert frontend deploy to previous build.
2. Clear CDN cache.
3. Verify `npm run build` succeeds.

### Database Migration

1. Run `npm run migrate:down` if migration is reversible.
2. If irreversible, apply compensating migration.
3. Verify tenant data integrity with spot checks.

## 5. Checklist

- [ ] Canary tenants identified and tagged
- [ ] Feature flag scope set to `canary`
- [ ] Monitoring dashboards reviewed
- [ ] Rollback triggers documented and communicated
- [ ] On-call engineer assigned for monitoring window
