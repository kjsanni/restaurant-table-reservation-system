# Canary Monitoring Setup

## Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/admin/monitoring/health` | Overall platform health + cron lock status |
| `GET /api/v1/admin/monitoring/queues` | BullMQ queue depths and failed jobs |
| `GET /api/v1/admin/monitoring/database` | MySQL connection pool and slow queries |
| `GET /api/v1/admin/monitoring/integrations` | Paystack, WhatsApp, Shaq Express latency |
| `GET /api/v1/admin/monitoring/errors` | 4xx/5xx error rates by tenant (last 24h) |

## Canary Tenant Selection

1. Tenant must be on `enterprise` plan
2. Tenant must have < 500 daily active users
3. Tenant must have `scope: "canary"` in feature flags
4. Super-admin sets canary flag via tenant detail view

## Monitoring Dashboard

Super-admin can filter monitoring dashboard by:
- `tenantId` — show metrics for specific canary tenant
- `featureFlag` — show metrics for specific flag rollout
- `timeRange` — 1h, 6h, 24h, 7d

## Alert Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Error rate (5xx) | < 0.1% | 0.1% - 1% | > 1% |
| P95 latency | < 200ms | 200ms - 500ms | > 500ms |
| Queue depth | < 100 | 100 - 1000 | > 1000 |
| Failed jobs | 0 | 1 - 10 | > 10 |
| Cron lock missed | 0 | 1 | > 1 |

## Canary Rollout Workflow

1. **Deploy** — feature flag deployed with `scope: "canary"`
2. **Enable for team** — super-admin enables for internal testers
3. **Canary 5%** — enable for 5% of canary tenants, monitor 24h
4. **Canary 25%** — if green, increase to 25%, monitor 24h
5. **Stable 10%** — promote to stable scope, roll to 10% general
6. **Stable 100%** — gradual increase to 100% over 48h

## Rollback Triggers

- Error rate > 2x baseline for any canary tenant
- P95 latency > 2s for 5 consecutive minutes
- Data integrity check failure (cross-tenant leak detected)
- Any P0 design review finding in production

## Rollback Steps

1. Set feature flag `scope: "disabled"` — immediate effect
2. If DB migration involved: `npm run migrate:down` on affected shard
3. Notify affected tenants via in-app banner + email
4. Post-mortem within 24h

## Observability

- Per-tenant metrics tagged with `tenantId` in Winston logs
- Sentry alerts scoped to canary tenant IDs
- BullMQ job names prefixed with `tenant:{id}:` for queue filtering
