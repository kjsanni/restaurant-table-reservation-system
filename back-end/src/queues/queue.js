const { Queue } = require("bullmq");
const { client, isConnected } = require("../utils/cache");

const shouldConnect = process.env.REDIS_HOST && process.env.REDIS_PORT;

const connection = shouldConnect
  ? {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    }
  : undefined;

const queues = [];

const createQueue = (name) => {
  if (!connection) {
    return null;
  }
  const queue = new Queue(name, { connection });
  queues.push(queue);
  return queue;
};

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

const safeAdd = async (queue, name, data, opts = {}) => {
  if (!queue) {
    return { enqueued: false };
  }
  try {
    const job = await queue.add(name, data, {
      ...defaultJobOptions,
      ...opts,
    });
    return { enqueued: true, jobId: job.id };
  } catch (err) {
    console.warn(`[Queue] Failed to enqueue ${name}:`, err.message);
    return { enqueued: false };
  }
};

const isRedisAvailable = async () => {
  if (!shouldConnect || !connection) return false;
  if (typeof isConnected === "boolean") return isConnected;
  try {
    if (client && typeof client.ping === "function") {
      await client.ping();
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const notificationQueue = createQueue("notifications");
const reportQueue = createQueue("reports");
const backupQueue = createQueue("backups");

const registerQueue = (queue) => {
  if (queue && !queues.includes(queue)) {
    queues.push(queue);
  }
};

const closeAllQueues = async () => {
  for (const queue of queues) {
    try {
      await queue.close();
    } catch (err) {
      console.warn("[Queue] Failed to close queue:", err.message);
    }
  }
  queues.length = 0;
};

const QUEUE_DEPTH_THRESHOLDS = {
  notifications: 1000,
  reports: 500,
  backups: 200,
  "erpnext-sync": 500,
};

const getQueueDepth = async (queue) => {
  if (!queue) return 0;
  try {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(0), 3000));
    const [waiting, active, delayed, failed] = await Promise.all([
      Promise.race([queue.getWaitingCount(), timeout]),
      Promise.race([queue.getActiveCount(), timeout]),
      Promise.race([queue.getDelayedCount(), timeout]),
      Promise.race([queue.getFailedCount(), timeout]),
    ]);
    return waiting + active + delayed + failed;
  } catch {
    return 0;
  }
};

const checkQueueDepths = async () => {
  if (!queues.length) return [];
  const alerts = [];
  for (const queue of queues) {
    const depth = await getQueueDepth(queue);
    const threshold = QUEUE_DEPTH_THRESHOLDS[queue.name] || 1000;
    if (depth > threshold) {
      alerts.push({ queue: queue.name, depth, threshold });
      console.warn(`[Queue] Depth alert: ${queue.name} has ${depth} jobs (threshold: ${threshold})`);
    }
  }
  return alerts;
};

module.exports = {
  connection,
  notificationQueue,
  reportQueue,
  backupQueue,
  createQueue,
  registerQueue,
  closeAllQueues,
  safeAdd,
  defaultJobOptions,
  isRedisAvailable,
  getQueueDepth,
  checkQueueDepths,
  QUEUE_DEPTH_THRESHOLDS,
};
