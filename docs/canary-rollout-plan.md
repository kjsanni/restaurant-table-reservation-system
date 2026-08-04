# Canary / Observability Rollout Plan

## Staged Rollout Strategy

| Stage | Tenant % | Duration | Success Criteria |
|-------|----------|----------|------------------|
| Canary | 5% | 24h | Error rate < baseline, p95 latency < 200ms |
| Early Access | 25% | 48h | No P1 incidents, DB CPU < 70% |
| General Availability | 100% | — | All health checks green |

## Pre-Deploy Checklist

- [ ] Backend tests pass (`cd back-end && npm test`)
- [ ] Frontend build passes (`cd front-end && npm run build`)
- [ ] Database migrations reviewed and tested
- [ ] Feature flags configured for staged enablement
- [ ] Monitoring dashboards refreshed (Sentry, Winston logs)
- [ ] Rollback procedure documented

## Post-Deploy Monitoring

### Key Metrics
- **Error rate:** Target < 0.1% of requests
- **p95 latency:** Target < 200ms for API routes
- **DB connection pool:** Alert if > 80% utilized
- **BullMQ queue depth:** Alert if > 1,000 jobs pending
- **Redis memory:** Alert if > 75% of maxmemory

### Alert Channels
- Sentry alerts for unhandled exceptions
- Winston logs shipped to centralized logging
- Email/Slack for P1 incidents

## Rollback Triggers

| Condition | Action |
|-----------|--------|
| Error rate > 1% for 5 min | Immediate rollback |
| p95 latency > 500ms for 10 min | Immediate rollback |
| DB down | Fail open to cached responses where safe |
| BullMQ queue > 5,000 | Pause non-critical workers |

## Rollback Procedure

1. `podman-compose -f podman-compose.yml up -d --force-recreate --scale backend=0`
2. Revert container image tag to previous version
3. `podman-compose -f podman-compose.yml up -d`
4. Verify `/api/v1/health` returns 200
5. Notify stakeholders
