const { closeAllQueues } = require("./queue");
const { closeNotificationWorker } = require("./notification.queue");
const { closeReportWorker } = require("./report.queue");
const { closeClient } = require("../utils/cache");

module.exports = async () => {
  console.log("[Jest Teardown] Closing BullMQ queues and workers...");
  await Promise.allSettled([
    closeNotificationWorker(),
    closeReportWorker(),
    closeAllQueues(),
    closeClient().catch(() => {}),
  ]);
  console.log("[Jest Teardown] Done.");
};
