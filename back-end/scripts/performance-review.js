#!/usr/bin/env node

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 500;
const REPORT_FILE = path.join(__dirname, "..", "reports", "performance-review.json");

const makeRequest = () => {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get("http://localhost:3000/api/v1/health", (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          duration: Date.now() - start,
          body: data,
        });
      });
    });
    req.on("error", (err) => {
      resolve({ error: err.message, duration: Date.now() - start });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ error: "timeout", duration: Date.now() - start });
    });
  });
};

const runLoadTest = async () => {
  console.log(`Starting performance review: ${TOTAL_REQUESTS} requests with ${CONCURRENT_REQUESTS} concurrency`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = [];
    for (let j = 0; j < CONCURRENT_REQUESTS && i + j < TOTAL_REQUESTS; j++) {
      batch.push(makeRequest());
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.statusCode === 200).length;
  const errorCount = results.filter((r) => r.error || r.statusCode !== 200).length;
  const durations = results.map((r) => r.duration).filter((d) => !isNaN(d));
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  const minDuration = durations.length ? Math.min(...durations) : 0;
  const p95Duration = durations.length ? Math.round(durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]) : 0;

  const report = {
    timestamp: new Date().toISOString(),
    config: { totalRequests: TOTAL_REQUESTS, concurrency: CONCURRENT_REQUESTS },
    results: {
      successCount,
      errorCount,
      successRate: `${((successCount / TOTAL_REQUESTS) * 100).toFixed(2)}%`,
      totalDuration: `${totalDuration}ms`,
      avgDuration: `${avgDuration}ms`,
      minDuration: `${minDuration}ms`,
      maxDuration: `${maxDuration}ms`,
      p95Duration: `${p95Duration}ms`,
      requestsPerSecond: Math.round((TOTAL_REQUESTS / totalDuration) * 1000),
    },
    issues: [],
  };

  if (report.results.successRate !== "100.00%") {
    report.issues.push({ severity: "high", description: `${errorCount} requests failed` });
  }
  if (p95Duration > 500) {
    report.issues.push({ severity: "medium", description: `P95 latency ${p95Duration}ms exceeds 500ms threshold` });
  }
  if (report.results.requestsPerSecond < 10) {
    report.issues.push({ severity: "medium", description: `Throughput ${report.results.requestsPerSecond} rps is below 10 rps threshold` });
  }

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log("Performance review complete. Report saved to", REPORT_FILE);
  console.log(`Success rate: ${report.results.successRate}`);
  console.log(`P95 latency: ${report.results.p95Duration}`);
  console.log(`Throughput: ${report.results.requestsPerSecond} rps`);
  console.log(`Issues: ${report.issues.length}`);

  if (report.issues.length > 0) {
    console.log("\nIssues found:");
    report.issues.forEach((issue) => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
  }

  process.exit(report.issues.length > 0 ? 1 : 0);
};

if (require.main === module) {
  runLoadTest().catch((err) => {
    console.error("Performance review failed:", err);
    process.exit(1);
  });
}

module.exports = { runLoadTest };
