# Canary Rollout Process

## Tenant Selection

- Canary tenants must be on the `enterprise` plan with < 500 daily active users.
- Super-admin selects canary tenants via `POST /api/v1/admin/erpnext/tenants/:id/provision` with `scope: "canary"`.

## Feature Flag Promotion

1. Deploy feature with `scope: "canary"` in feature flag config.
2. Monitor canary tenants for 48h: error rate < 0.1%, latency p99 < 500ms.
3. Promote to `scope: "stable"` via super-admin portal.
4. Roll out to remaining tenants in batches of 10% over 24h.

## Rollback Triggers

- Error rate > 1% for any tenant cohort
- p99 latency > 2s for 5 consecutive minutes
- Data integrity check failure (cross-tenant leak detected)

## Rollback Steps

1. Revert feature flag to `scope: "disabled"` — immediate effect.
2. If DB migration involved: run `npm run migrate:down` on affected shard.
3. Notify affected tenants via in-app banner + email.
4. Post-mortem within 24h.

## Health Checks

- `/api/v1/admin/monitoring/health` returns cron lock status, cache hit rate, queue depths.
- Canary tenants are tagged in monitoring for filtered dashboards.
