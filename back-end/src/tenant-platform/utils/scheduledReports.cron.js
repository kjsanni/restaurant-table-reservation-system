const scheduledReportDAO = require("../../DAOs/scheduledReport.dao");
const { processScheduledReport } = require("../../controllers/scheduledReport.controller");

const SCHEDULED_REPORTS_CRON_LOCK_KEY = "scheduled-reports:cron:lock";
const SCHEDULED_REPORTS_CRON_LOCK_TTL = 300;

const runScheduledReportsCron = async () => {
  let lockAcquired = false;
  try {
    const { client } = require("../../utils/cache");
    if (client && client.isReady) {
      const result = await client.set(SCHEDULED_REPORTS_CRON_LOCK_KEY, "1", {
        EX: SCHEDULED_REPORTS_CRON_LOCK_TTL,
        NX: true,
      });
      lockAcquired = result === "OK";
    }

    if (!lockAcquired) {
      return;
    }

    const dueReports = await scheduledReportDAO.findDue();
    if (dueReports.length === 0) {
      return;
    }

    console.log(`[ScheduledReportsCron] Processing ${dueReports.length} due report(s)`);

    for (const report of dueReports) {
      try {
        await processScheduledReport(report);
        console.log(`[ScheduledReportsCron] Processed report #${report.id}: ${report.name}`);
      } catch (err) {
        console.error(`[ScheduledReportsCron] Failed to process report #${report.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[ScheduledReportsCron] Error:", err.message);
  } finally {
    const { client } = require("../../utils/cache");
    if (lockAcquired && client && client.isReady) {
      try {
        await client.del(SCHEDULED_REPORTS_CRON_LOCK_KEY);
      } catch (err) {
        console.error("[ScheduledReportsCron] Lock release error:", err.message);
      }
    }
  }
};

module.exports = { runScheduledReportsCron };
