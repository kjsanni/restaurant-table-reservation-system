"use strict";

/**
 * BullMQ notification-dispatch throughput benchmark.
 *
 * Target from the deployment checklist: 500 emails/min via BullMQ, and "process
 * all jobs within 5min of enqueue".
 *
 * This benchmark measures the *pipeline capacity* of BullMQ + Redis with a
 * no-op processor (it does NOT send real email/WhatsApp — that would spam real
 * inboxes and its throughput is bound by the SMTP provider, not the system under
 * test). A per-job artificial delay approximates real send latency; tune with
 * --sendMs.
 *
 * It runs on an isolated queue name so it never interferes with the app's real
 * "notifications" queue or workers.
 *
 * Usage:
 *   node load-tests/queue-bench.js --jobs 500 --concurrency 5 --sendMs 50
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { Queue, Worker, QueueEvents } = require("bullmq");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  return fallback;
}

const JOBS = parseInt(arg("jobs", "500"), 10);
const CONCURRENCY = parseInt(arg("concurrency", "5"), 10);
const SEND_MS = parseInt(arg("sendMs", "50"), 10); // simulated per-email send latency

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
};

const QUEUE_NAME = "loadtest-notifications-bench";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const queue = new Queue(QUEUE_NAME, { connection });
  const events = new QueueEvents(QUEUE_NAME, { connection });
  await events.waitUntilReady();

  // Drain any leftovers from a prior run.
  await queue.obliterate({ force: true }).catch(() => {});

  let completed = 0;
  let failed = 0;
  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      // Simulate the send latency of a real email dispatch.
      if (SEND_MS > 0) await sleep(SEND_MS);
      return true;
    },
    { connection, concurrency: CONCURRENCY }
  );
  worker.on("completed", () => completed++);
  worker.on("failed", () => failed++);
  await worker.waitUntilReady();

  console.log(
    `Enqueuing ${JOBS} email jobs (concurrency=${CONCURRENCY}, simulated send=${SEND_MS}ms)...`
  );

  const enqueueStart = Date.now();
  const batch = [];
  for (let i = 0; i < JOBS; i++) {
    batch.push({
      name: "email",
      data: {
        type: "email",
        payload: { to: `user${i}@load.test`, templateKey: "reservation_confirmation", data: {}, tenantId: (i % 100) + 1 },
      },
      opts: { removeOnComplete: true },
    });
  }
  await queue.addBulk(batch);
  const enqueueMs = Date.now() - enqueueStart;
  const enqueueRate = ((JOBS / enqueueMs) * 1000).toFixed(0);

  console.log(`Enqueued ${JOBS} jobs in ${enqueueMs}ms (${enqueueRate} jobs/s enqueue rate).`);
  console.log("Draining...");

  const drainStart = Date.now();
  const DEADLINE_MS = 5 * 60 * 1000; // checklist SLA
  while (completed + failed < JOBS) {
    if (Date.now() - drainStart > DEADLINE_MS) {
      console.warn("Deadline (5min) reached before drain completed.");
      break;
    }
    await sleep(100);
  }
  const drainMs = Date.now() - drainStart;
  const throughputPerMin = ((completed / drainMs) * 60000).toFixed(0);

  console.log("\n=== BullMQ Notification Dispatch Benchmark ===");
  console.log(`Jobs enqueued:        ${JOBS}`);
  console.log(`Completed:            ${completed}`);
  console.log(`Failed:               ${failed}`);
  console.log(`Enqueue time:         ${enqueueMs}ms (${enqueueRate} jobs/s)`);
  console.log(`Drain time:           ${drainMs}ms (${(drainMs / 1000).toFixed(1)}s)`);
  console.log(`Effective throughput: ${throughputPerMin} jobs/min`);
  console.log(`Within 5min SLA:      ${drainMs <= DEADLINE_MS ? "YES" : "NO"}`);
  console.log(`Meets 500/min target: ${Number(throughputPerMin) >= 500 ? "YES" : "NO"}`);

  await worker.close();
  await events.close();
  await queue.obliterate({ force: true }).catch(() => {});
  await queue.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Queue bench failed:", err);
  process.exit(1);
});
