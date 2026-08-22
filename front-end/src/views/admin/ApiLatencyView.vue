<template>
  <div class="api-latency-view">
    <div class="page-header">
      <div>
        <h1>API Latency</h1>
        <p class="subtitle">
          Request duration percentiles across all endpoints
        </p>
      </div>
      <button class="btn-secondary" @click="refresh" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Samples</div>
        <div class="card-value">{{ metrics.sampleCount }}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg</div>
        <div class="card-value">
          {{ metrics.overall?.avgMs ?? "—" }}<span class="unit">ms</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">p50</div>
        <div class="card-value">
          {{ metrics.overall?.p50Ms ?? "—" }}<span class="unit">ms</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">p95</div>
        <div class="card-value" :class="p95Class">
          {{ metrics.overall?.p95Ms ?? "—" }}<span class="unit">ms</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">p99</div>
        <div class="card-value" :class="p99Class">
          {{ metrics.overall?.p99Ms ?? "—" }}<span class="unit">ms</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Slowest Endpoints</h3>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="metrics.byEndpoint.length === 0" class="empty-state">
        No latency data collected yet
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Count</th>
              <th>Avg</th>
              <th>p95</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in metrics.byEndpoint" :key="row.endpoint">
              <td class="endpoint-cell">{{ row.endpoint }}</td>
              <td>{{ row.count }}</td>
              <td>{{ row.avgMs }}ms</td>
              <td>{{ row.p95Ms }}ms</td>
              <td>{{ row.maxMs }}ms</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const metrics = ref({ sampleCount: 0, overall: null, byEndpoint: [] });

const p95Class = () => {
  const v = metrics.value.overall?.p95Ms;
  if (v == null) return "";
  if (v < 200) return "success";
  if (v < 500) return "warn";
  return "danger";
};

const p99Class = () => {
  const v = metrics.value.overall?.p99Ms;
  if (v == null) return "";
  if (v < 300) return "success";
  if (v < 800) return "warn";
  return "danger";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getApiLatency();
    metrics.value = res.data?.data || {
      sampleCount: 0,
      overall: null,
      byEndpoint: [],
    };
  } finally {
    loading.value = false;
  }
};

const refresh = () => load();

onMounted(() => {
  load();
});
</script>

<style scoped>
.api-latency-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-2);
}
.card-value .unit {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-left: var(--space-1);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.warn {
  color: var(--amber-600);
}
.card-value.danger {
  color: var(--rose-600);
}

.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.endpoint-cell {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}
</style>
