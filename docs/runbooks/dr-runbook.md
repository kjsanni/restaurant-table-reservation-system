# Disaster Recovery Runbook

## 1. RPO / RTO Targets

| Scenario | RPO | RTO | Data Source |
|----------|-----|-----|-------------|
| Single tenant data loss | 15 min | 1 hour | Latest backup + WAL |
| Full database failure | 1 hour | 2 hours | Point-in-time restore |
| Isolation incident (cross-tenant leak) | 0 | 30 min | Audit log replay + DB snapshot |
| Worker/queue failure | 5 min | 15 min | Redis persistence + job replay |

## 2. Backup Verification

- Automated backups run hourly via `backupCron`.
- Verify `backupRecord.status = completed` in super-admin dashboard.
- Weekly restore drill: restore latest backup to staging, run `npm test`.

## 3. Restore Procedure

1. **Stop writes** — Enable maintenance mode or disable public routes.
2. **Identify target** — Confirm tenant ID and backup file.
3. **Restore database**:
   ```bash
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < backup.sql
   ```
4. **Replay WAL** — Apply binlog changes from backup timestamp to failure point.
5. **Clear caches** — Flush Redis (`redis-cli FLUSHDB`) and restart workers.
6. **Verify** — Run tenant smoke tests + check `/api/v1/health`.
7. **Resume** — Disable maintenance mode; notify tenants if downtime exceeded SLA.

## 4. Isolation Incident Playbook

1. **Detect** — Alert from Sentry, Codacy, or tenant report.
2. **Contain** — Suspend affected tenant via `POST /admin/tenants/:id/disable`.
3. **Investigate** — Pull `platformAudit` logs + `usageEvents` for tenant ID.
4. **Remediate** — Re-seed correct tenant data from last known good backup.
5. **Validate** — Run cross-tenant isolation test suite (`npm test -- cross-tenant`).
6. **Communicate** — Send incident report to tenant + DPO within 24h (Act 843).

## 5. DR Contacts

- **CTO / Platform lead:** primary on-call
- **DBA:** backup/restore execution
- **Security:** isolation incident lead
- **Support:** tenant communication
