# Performance Benchmarks — Baseline Report

## Backend

| Metric | Value | Notes |
|--------|-------|-------|
| Test suite count | 165 suites | |
| Test count | 1,193 tests | All passing |
| Test execution time | ~14s | ForceExit enabled |
| Database | MySQL via Sequelize | Connection pooling active |
| Cache | Redis via `tenantCache` | Used in schedule, holiday, setting DAOs |
| Queue | BullMQ | Notification, report, backup, provisioning, wallet pass workers |

### API Response Time Targets (not yet measured in production)
- Authentication: < 200ms (p95)
- Tenant CRUD: < 300ms (p95)
- Reservation queries: < 500ms (p95)
- Report generation: < 2s (p95) — async via BullMQ

### Database Query Optimization
- N+1 queries: reviewed in DAOs; uses `include` for associations
- Indexes: verified on foreign keys (`tenantId`, `userId`, `customerId`)
- Slow query log: exposed via `/api/v1/admin/monitoring/database`

## Frontend

| Metric | Value | Notes |
|--------|-------|-------|
| Build time | ~1.3s | Vite production build |
| Initial JS bundle | 263 KB / 83 KB gzip | `index-*.js` |
| Vuestic UI chunk | 455 KB / 146 KB gzip | Shared UI library |
| Super admin overview | 188 KB / 65 KB gzip | Largest single view |
| Customer landing | 20 KB / 6 KB gzip | Lightest view |

### Core Web Vitals Targets
- LCP: ≤ 2.5s (target)
- INP: ≤ 200ms (target)
- CLS: ≤ 0.1 (target)

### Image Optimization
- Hero images: manifest created at `front-end/src/assets/images/manifest.json`
- Actual images: pending API key configuration for generation
- Current: no hero images in use; placeholders only

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Redis | Required | Cron lock, caching, BullMQ |
| MySQL | Required | Primary database |
| Podman | Production | Container runtime per decision |
| Socket.IO | Active | Real-time updates |

## Recommendations

1. **Add API response time logging** — instrument `requestMetrics` middleware to log p95/p99 per endpoint
2. **Add bundle size CI check** — use `rollup-plugin-visualizer` or `bundlesize` to catch regressions
3. **Add Lighthouse CI** — run automated Core Web Vitals checks on PRs
4. **Generate portal hero images** — configure image-gen API keys and produce assets
5. **Run production load test** — simulate 1000 concurrent tenants to validate scaling assumptions
