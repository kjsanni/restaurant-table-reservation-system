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

// Shared retry policy with exponential backoff. Applied to every enqueued job
// so failed jobs are retried automatically before landing in the DLQ.
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

// Centralized enqueue helper. Returns { enqueued: true, jobId } when the job is
// accepted by BullMQ, or { enqueued: false } when Redis is unavailable or the
// call throws. Callers MUST fall back to synchronous execution on false.
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

// True if a real Redis connection is configured and reachable.
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

module.exports = {
  connection,
  notificationQueue,
  reportQueue,
  createQueue,
  registerQueue,
  closeAllQueues,
  safeAdd,
  defaultJobOptions,
  isRedisAvailable,
};
