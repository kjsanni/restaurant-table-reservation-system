# Production Deployment Checklist — Multi-Tenant Scale

> Target: 100k tenants / 1M customers
> Environment: Node.js + Express + Sequelize + MySQL + Redis + BullMQ + PM2 cluster

---

## 1. Database

### Connection Pool
- [ ] Set `DB_POOL_MIN=10`, `DB_POOL_MAX=50`, `DB_POOL_IDLE=10000`, `DB_POOL_ACQUIRE=30000` in production `.env`
- [ ] Verify `SHOW VARIABLES LIKE 'max_connections'` on MySQL — ensure `pool_max * PM2 instances` < `max_connections`
- [ ] Monitor connection usage: `SHOW STATUS LIKE 'Threads_connected'`

### Read Replicas
- [ ] Provision at least 1 read replica for reporting/analytics queries
- [ ] Update Sequelize config to support read/write splitting (or route report queries to replica manually)
- [ ] Ensure `paymentDAO.getRevenueStats`, `reservationDAO.getHeatmapV2`, etc. use replica if available

### Partitioning / Sharding
- [ ] Evaluate tenant-based partitioning on largest tables (`Reservations`, `Payments`, `Customers`) by `tenantId` range or hash
- [ ] For 1M+ reservations, consider horizontal sharding by `tenantId` across multiple MySQL instances
- [ ] If using partitioning: `ALTER TABLE Reservations PARTITION BY HASH(tenantId) PARTITIONS 64;`

### Indexes
- [ ] Verify all composite unique indexes exist: `(tenantId, email)`, `(tenantId, username)`, `(tenantId, name)`, etc.
- [ ] Run `EXPLAIN` on slow queries and add missing indexes on `tenantId` + filter columns
- [ ] Consider covering indexes for hot paths: `(tenantId, resDate, resStatus)` on Reservations

### Backups
- [ ] Enable automated daily backups with point-in-time recovery
- [ ] Test restore procedure on staging environment

---

## 2. Redis

### Configuration
- [ ] Set `maxmemory` and `maxmemory-policy` (e.g., `allkeys-lru`) to prevent OOM
- [ ] Enable AOF + RDB persistence for durability
- [ ] Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in production `.env`

### Sentinel / Cluster
- [ ] For HA: deploy Redis Sentinel (3 nodes) or Redis Cluster (6 nodes)
- [ ] Update BullMQ + rate-limit-redis + cache.js to use Sentinel/Cluster connection strings
- [ ] Test failover: kill primary, verify workers reconnect within 30s

### Key Eviction
- [ ] Review TTLs:
  - Tenant cache: 300s (5min) — appropriate
  - Negative tenant cache: 30s — appropriate
  - Rate limiter keys: per-window (15min/1hr) — appropriate
  - Cron lock: 300s — appropriate
  - Schedule/holiday cache: 300s — consider increasing to 600s

---

## 3. PM2 Cluster

### Configuration
- [ ] Set `instances: "max"` or a fixed number based on CPU cores
- [ ] Set `exec_mode: "cluster"`
- [ ] Enable `--no-daemon` for Docker/Kubernetes, or use PM2 daemon with `pm2 startup`
- [ ] Set `max_memory_restart` (e.g., `1G`) to prevent memory leaks

### Cron / Workers
- [ ] BullMQ workers run on all cluster instances by default — verify `concurrency` is tuned per instance
- [ ] `tenantCron` uses Redis distributed lock — verify only 1 instance runs cron per cycle
- [ ] Consider separating workers to dedicated PM2 processes if notification volume is high

### Logging
- [ ] Configure PM2 log rotation: `pm2 install pm2-logrotate`
- [ ] Set `log_date_format` for structured logging
- [ ] Ship logs to centralized logging (ELK, Datadog, etc.)

---

## 4. Application

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `TENANT_MODE=enabled` (only after full multi-tenant testing)
- [ ] `VITE_TENANT_MODE=enabled` in frontend build
- [ ] `JWT_SECRET` — 32+ random characters, rotated quarterly
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- [ ] `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_IDLE`, `DB_POOL_ACQUIRE`

### Security
- [ ] Disable CORS for all origins except production domain
- [ ] Enable HTTPS everywhere (`secure: true` on cookies, `helmet` HSTS)
- [ ] Verify `csrf` cookie `sameSite: "lax"` in production
- [ ] Ensure `PAYSTACK_WEBHOOK_SECRET` is set for webhook signature verification
- [ ] Rotate all default credentials (admin password, JWT secret, etc.)

### Rate Limiting
- [ ] Verify `authLimiter` (10/15min), `generalLimiter` (100/15min), `bulkOperationLimiter` (5/hr), `adminActionLimiter` (3/hr) are appropriate for production traffic
- [ ] Adjust limits based on load testing results
- [ ] Monitor rate limit hit rate in Redis keyspace

### BullMQ
- [ ] Set `concurrency` on workers based on expected throughput
- [ ] Add dead-letter queue (DLQ) for failed jobs
- [ ] Implement job retry policy with exponential backoff
- [ ] Monitor queue depth: alert if `notification` queue > 1000 jobs

---

## 5. Frontend

### Build
- [ ] Build with `VITE_TENANT_MODE=enabled npm run build`
- [ ] Verify `dist/` contains tenant admin routes
- [ ] Set `VITE_API_URL` to production API endpoint

### Tenant Context
- [ ] Verify `X-Tenant-Id` header is sent on all API requests when tenant is selected
- [ ] Test tenant switcher pagination with 100+ tenants
- [ ] Verify branding (logo, colors) loads from `tenant.settings.branding`

---

## 6. Monitoring & Alerting

### Metrics
- [ ] Request latency p95/p99
- [ ] Error rate (5xx, 4xx)
- [ ] DB connection pool utilization
- [ ] Redis memory usage and hit rate
- [ ] BullMQ queue depth and job failure rate
- [ ] PM2 cluster instance count and restart count

### Alerts
- [ ] Alert if `Threads_connected` > 80% of `max_connections`
- [ ] Alert if Redis memory > 80% of `maxmemory`
- [ ] Alert if BullMQ queue depth > 1000
- [ ] Alert if tenant cron lock is held > 10min (indicates stuck cron)

---

## 7. Load Testing

### Scenarios
- [ ] 1000 concurrent authenticated users per tenant
- [ ] 100 tenants active simultaneously
- [ ] Peak reservation creation rate: 100 req/min
- [ ] Notification dispatch: 500 emails/min via BullMQ

### Targets
- [ ] API p95 latency < 500ms
- [ ] DB query p95 latency < 100ms
- [ ] Zero data leaks between tenants under load
- [ ] BullMQ processes all jobs within 5min of enqueue

---

## 8. Rollback Plan

- [ ] Database migration rollback scripts tested (`db:migrate:undo`)
- [ ] Feature flag `TENANT_MODE` can be disabled instantly
- [ ] Blue/green deployment or canary release strategy defined
- [ ] Backend can run single-tenant mode with existing data (tenantId nullable)

---

## Open Items (Phase 2)

- [ ] DAO query scoping verification for remaining edge cases (raw SQL queries, instance methods)
- [ ] BullMQ full integration: replace synchronous notification sends with enqueued jobs
- [ ] MySQL tenant-based partitioning implementation
- [ ] Read replica integration for reporting queries
- [ ] Redis Cluster migration from standalone
