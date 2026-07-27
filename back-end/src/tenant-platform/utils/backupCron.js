const { safeAdd } = require("../../queues/queue");
const backupRecordDAO = require("../DAOs/backupRecord.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");

const BACKUP_CRON_LOCK_KEY = "backup:cron:lock";
const BACKUP_CRON_LOCK_TTL = 300;

const runBackupCron = async () => {
  const { client } = require("../../utils/cache");
  let lockAcquired = false;
  try {
    if (client && client.isReady) {
      const result = await client.set(BACKUP_CRON_LOCK_KEY, "1", {
        EX: BACKUP_CRON_LOCK_TTL,
        NX: true,
      });
      lockAcquired = result === "OK";
    }

    if (!lockAcquired) {
      return;
    }

    const scheduled = await backupRecordDAO.findScheduled();
    for (const record of scheduled) {
      const jobId = `backup-${record.id}`;
      const { enqueued } = await safeAdd(
        require("../../queues/queue").backupQueue,
        "scheduled-backup",
        { backupId: record.id, type: record.type },
        { jobId }
      );

      if (enqueued) {
        await backupRecordDAO.updateScheduling(record.id, {
          lastRunAt: new Date(),
        });

        await platformAuditDAO.log(
          null,
          "backup.scheduled",
          "backup",
          record.id,
          null,
          { frequency: record.frequency },
          null
        );
      }
    }
  } catch (err) {
    console.error("[BackupCron] Error:", err.message);
  } finally {
    if (lockAcquired && client && client.isReady) {
      try {
        await client.del(BACKUP_CRON_LOCK_KEY);
      } catch (err) {
        console.error("[BackupCron] Lock release error:", err.message);
      }
    }
  }
};

module.exports = { runBackupCron };
