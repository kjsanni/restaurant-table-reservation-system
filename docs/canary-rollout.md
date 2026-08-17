# Canary & Staged Rollout Process

**Date:** 2026-08-12  
**Applies to:** All changes deploying to the multi-tenant super-admin portal

---

## Overview

All changes follow a staged rollout to minimize blast radius. The process is
divided into four gates, each with explicit entry and exit criteria.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Local  │ → │  Canary  │ → │  Staging │ → │ Production │
│  (dev)   │    │ (5%)   │    │ (100%)   │    │ (staged)   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Gate 0: Local Verification

### Gate 0 — Entry criteria
- Working tree committed to a feature branch
- Branch passes lint + typecheck + unit tests (881 tests)

### Gate 0 — Exit criteria
- `npm run lint` — 0 errors
- `cd front-end && npm run build` — succeeds
- `cd back-end && npm test` — 881 tests pass
- `npm run migrate:up` — migrations apply cleanly in local MySQL

### Gate 0 — Command
```bash
cd front-end && npm run lint && npm run build && \
  cd ../back-end && npm test && npm run migrate:up --dry-run
```

---

## Gate 1: Canary (5% of tenants)

### Gate 1 — Entry criteria
- Feature deployed to canary Podman container on port 8080
- Canary runs behind the `X-Tenant-ID` header allowlist

### Gate 1 — Exit criteria
- No 5xx errors in Grafana dashboard for 15 minutes
- No Sentry alerts in canary namespace
- Health check `/health` passes for all canary pods

### Canary tenant selection
Use the allowlist in `config/canary-tenants.json`:
```json
{
  "tenants": [
    { "id": 1, "name": "Default Demo", "slug": "demo" }
  ],
  "percentage": 5
}
```

### Gate 0 — Command
```bash
podman run -p 8080:8080 \
  --env NODE_ENV=canary \
  --env CANARY_TENANTS=1 \
  registry.local/rtrs-backend:edge
```

---

## Gate 2: Staging (100% of tenants)

### Gate 2 — Entry criteria
- Canary gate passed
- Feature deployed to staging namespace

### Gate 0 — Exit criteria
- All 881 backend tests pass against staging DB
- Frontend type-check passes in staging CI
- QA sign-off on 5 key flows: tenant create, suspend, feature flags, onboarding, support tickets

### Staging verification script
```bash
#!/bin/bash
# scripts/verify-staging.sh
npx playwright test --project=staging --grep="@admin"
```

---

## Gate 3: Production (Staged Rollout)

### Deployment strategy: Blue/Green with weighted routing via Podman + Nginx

| Step | Percentage | Criteria | Duration |
|------|-----------|----------|----------|
| 1 | 5% | Monitor error rate <0.1%, p95 latency <500ms | 15 min |
| 2 | 25% | No Sentry alerts, no performance degradation | 30 min |
| 3 | 50% | Health checks pass for all pods | 30 min |
| 4 | 100% | Full rollout, rollback plan ready | remaining |

### Entry criteria
- Staging gate passed
- Rollback plan documented
- Runbook in `docs/runbook-tenant-*` consulted

### Production deployment command
```bash
# Deploy green environment
podman run -d --name rtrs-backend-green \
  --env NODE_ENV=production \
  --env DB_HOST=db-green.rtrs.internal \
  registry.local/rtrs-backend:v$(git describe --tags)

# Weight traffic 5% to green, 95% to blue
# (nginx config: set proxy_weight accordingly)
```

### Monitoring checklist (during rollout)
- [ ] Grafana: error rate <0.1% across all services
- [ ] Sentry: no new issue groups in the last 15 min
- [ ] Redis: cache hit rate >90%
- [ ] MySQL: slow query log empty
- [ ] Socket.IO: connection count stable
- [ ] Paystack webhooks: pending count <10

### Rollback command
```bash
# If any gate fails, shift 100% traffic back to blue
podman stop rtrs-backend-green
# Verify traffic back to blue via health check
```

---

## Rollback Criteria

Rollback immediately if ANY of:
1. **Error rate** exceeds 0.5% for >5 minutes
2. **p95 latency** exceeds 2000ms for >5 minutes
3. **Sentry** creates a new issue group with >100 occurrences
4. **Database** connection pool exhaustion detected
5. **Paystack webhook** queue exceeds 100 pending

Rollback procedure:
```bash
1. Shift 100% traffic to previous (blue) environment
2. Run `npm run migrate:up -- --to 20260718000007` (revert new migrations)
3. Notify on-call: `#ops-alerts` channel in Slack
4. Document incident in `docs/incidents/YYYY-MM-DD-canary-rollback.md`
```

---

## Post-Rollout

### 24-hour monitoring
- Daily dashboard review at 09:00, 15:00, 21:00 GMT
- Check tenant support tickets for regression reports

### Documentation update
After successful rollout:
1. Update `docs/900-Session-Summary.md` with deployment timestamp
2. Update `CHANGELOG.md` with feature description
3. Refresh `llms.txt` if new routes were added

### Canary reset
```bash
# Move all canary tenants to stable track
node scripts/canary-reset.js
```
