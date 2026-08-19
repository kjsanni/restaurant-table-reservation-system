# Disaster Recovery Runbook

## Overview
Procedures for database restore, tenant isolation incidents, and platform recovery.

## RPO / RTO Targets
- **RPO (Recovery Point Objective):** 15 minutes
- **RTO (Recovery Time Objective):** 1 hour

## Backup Schedule
- **Full backup:** Daily at 02:00 UTC
- **Incremental backup:** Every 15 minutes
- **Binary logs:** Continuous archiving
- **Retention:** 30 days

## Restore Drill Procedure

### 1. Verify Backup Integrity
```bash
# Check latest backup
ls -la /backups/latest/

# Verify backup checksum
sha256sum /backups/latest/full-backup.sql
```

### 2. Restore Database
```bash
# Stop application
systemctl stop rtrs-backend

# Restore from backup
mysql -u root -p rtrs_production < /backups/latest/full-backup.sql

# Apply binary logs
mysqlbinlog /backups/binlogs/* | mysql -u root -p rtrs_production
```

### 3. Verify Tenant Isolation
```bash
# Check for cross-tenant data leakage
node back-end/src/tenant-platform/utils/chaos-harness.js --check-isolation
```

### 4. Restart Services
```bash
systemctl start rtrs-backend
systemctl start rtrs-nginx
```

## Isolation Incident Playbook

### Symptom: Cross-tenant data visible
1. Immediately enable read-only mode for affected tenants
2. Run tenant isolation audit
3. Identify leaked data
4. Notify affected tenants (GDPR/DPA compliance)
5. Restore from last known good backup if necessary

### Symptom: Tenant data missing
1. Check database logs for DELETE operations
2. Restore from backup if data is permanently lost
3. Verify referential integrity
4. Notify affected tenant

## Escalation
- **On-call engineer:** Check PagerDuty
- **Database admin:** Contact DBA team
- **Legal/compliance:** Notify DPO for data breach assessment
