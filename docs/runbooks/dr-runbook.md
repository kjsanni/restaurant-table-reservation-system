# Disaster Recovery Runbook

## RPO / RTO Definitions

| Scenario | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) |
|----------|-------------------------------|-------------------------------|
| Single tenant data loss | 5 minutes | 15 minutes |
| Platform-wide database failure | 1 hour | 30 minutes |
| Redis cache loss | 0 (rebuild from DB) | 5 minutes |
| BullMQ queue loss | 0 (jobs requeued) | 10 minutes |
| Isolation incident (cross-tenant leak) | 0 (contain + audit) | 30 minutes |

## Per-Tenant Restore Procedure

### Prerequisites
- Access to database backup snapshots (daily at 02:00 UTC)
- Redis cluster access
- Super-admin break-glass session activated

### Steps
1. **Identify tenant and scope**
   - Get tenant ID from super-admin portal
   - Confirm data loss scope (all data vs. specific tables)

2. **Pause tenant operations**
   - Set tenant `status: "suspended"` via `POST /api/v1/admin/tenants/:id/suspend`
   - This blocks new reservations/appointments/orders

3. **Restore database**
   - Identify last good backup before incident
   - For full tenant restore: `mysql -u root -p vibespot < backup_tenant_{id}_{date}.sql`
   - For partial restore: run specific table restores

4. **Rebuild cache**
   - Flush tenant cache: `redis-cli DEL "tenant:{id}:*"`
   - Cache will rebuild on next read requests via `tenantCache`

5. **Requeue failed jobs**
   - Identify failed BullMQ jobs for tenant: `queue.getFailedJobs(0, 100)`
   - Requeue: `job.retry()`

6. **Verify integrity**
   - Run tenant-specific data counts vs. expected
   - Check no cross-tenant data leakage: `SELECT COUNT(*) FROM reservations WHERE tenantId = {id}`
   - Verify legal acceptances intact

7. **Resume operations**
   - Set tenant `status: "active"`
   - Notify tenant admin of restore completion

## Platform-Wide Restore Procedure

### Prerequisites
- Access to primary database server
- Read replica promotion capability
- Super-admin break-glass session activated

### Steps
1. **Assess failure scope**
   - Check `/api/v1/admin/monitoring/health` for database status
   - Check MySQL replication status: `SHOW SLAVE STATUS`
   - Determine if failover to read replica is needed

2. **Promote read replica (if primary is down)**
   - Stop replication: `STOP SLAVE; RESET SLAVE ALL;`
   - Promote replica: `SET GLOBAL read_only = OFF;`
   - Update application config to point to new primary

3. **Restore from backup (if data loss)**
   - Identify last good full backup
   - Restore to new primary: `mysql -u root -p vibespot < backup_full_{date}.sql`
   - Apply WAL/binlog replay since backup

4. **Verify platform health**
   - Check all health endpoints return 200
   - Verify queue workers reconnect
   - Verify Socket.IO connections re-establish

5. **Resume tenant operations**
   - Un-suspend tenants that were auto-suspended during outage
   - Notify all tenants via in-app banner + email

## Isolation Incident Playbook

### Detection
- Cross-tenant data leak detected via audit log or customer report
- Monitoring dashboard shows data from tenant A appearing in tenant B's queries
- Security scan reveals unauthorized data access

### Containment
1. **Immediate isolation**
   - Identify affected tenant pairs
   - Set both tenants `status: "suspended"`
   - Disable feature flags for affected modules

2. **Preserve evidence**
   - Export audit logs for affected time window
   - Snapshot database state: `mysqldump --single-transaction vibespot > incident_{timestamp}.sql`
   - Export Redis state: `redis-cli BGSAVE`

3. **Assess scope**
   - Query for cross-tenant records: `SELECT * FROM reservations WHERE tenantId NOT IN (allowed_ids)`
   - Check all shared tables: payments, customers, settings
   - Determine if PII was exposed

### Remediation
1. **Clean contaminated data**
   - Delete or reassign cross-tenant records
   - If PII exposed: initiate DPA 2012 breach notification process
   - Document all changes in audit log

2. **Fix root cause**
   - Identify code path that allowed cross-tenant access
   - Deploy hotfix with tenant isolation validation
   - Add regression test for specific leak pattern

3. **Resume operations**
   - Re-enable tenant feature flags
   - Set tenants `status: "active"`
   - Notify affected tenants with incident summary

### Post-Incident
- Write post-mortem within 24h
- Update isolation tests in CI
- Review all multi-tenant query paths for similar patterns
