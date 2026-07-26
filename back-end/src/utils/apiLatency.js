const apiLatencyMetrics = {
  samples: [],
  maxSamples: 1000,
};

const recordLatency = (req, latencyMs) => {
  const sample = {
    method: req.method,
    path: req.originalUrl || req.url,
    status: req.statusCode,
    latencyMs,
    timestamp: new Date().toISOString(),
  };
  apiLatencyMetrics.samples.push(sample);
  if (apiLatencyMetrics.samples.length > apiLatencyMetrics.maxSamples) {
    apiLatencyMetrics.samples.shift();
  }
};

const getLatencyMetrics = () => {
  const samples = apiLatencyMetrics.samples;
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      overall: null,
      byEndpoint: [],
    };
  }

  const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
  const percentile = (p) => {
    const index = Math.ceil((p / 100) * latencies.length) - 1;
    return latencies[Math.max(0, index)];
  };

  const overall = {
    count: latencies.length,
    avgMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    p50Ms: Math.round(percentile(50)),
    p95Ms: Math.round(percentile(95)),
    p99Ms: Math.round(percentile(99)),
    minMs: latencies[0],
    maxMs: latencies[latencies.length - 1],
  };

  const endpointMap = new Map();
  for (const s of samples) {
    const key = `${s.method} ${s.path}`;
    if (!endpointMap.has(key)) {
      endpointMap.set(key, []);
    }
    endpointMap.get(key).push(s.latencyMs);
  }

  const byEndpoint = Array.from(endpointMap.entries())
    .map(([endpoint, values]) => {
      values.sort((a, b) => a - b);
      return {
        endpoint,
        count: values.length,
        avgMs: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        p95Ms: Math.round(percentileFor(values, 95)),
        maxMs: values[values.length - 1],
      };
    })
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 50);

  return {
    sampleCount: samples.length,
    overall,
    byEndpoint,
  };
};

const percentileFor = (sorted, p) => {
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

const clearLatencyMetrics = () => {
  apiLatencyMetrics.samples = [];
};

module.exports = {
  recordLatency,
  getLatencyMetrics,
  clearLatencyMetrics,
};
