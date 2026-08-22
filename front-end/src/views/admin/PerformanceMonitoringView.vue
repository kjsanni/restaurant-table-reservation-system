<template>
  <div class="monitoring-view">
    <div class="page-header">
      <div>
        <h1>Performance & Health</h1>
        <p class="subtitle">
          Queue depth, database stats, error rates, and integration latency
        </p>
      </div>
      <button class="btn-primary" @click="refreshAll" :disabled="refreshing">
        {{ refreshing ? "Refreshing..." : "Refresh All" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Queue Stats</h3>
        <div v-if="queueLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="queueData" class="queue-list">
          <div v-for="q in queueData.queues" :key="q.name" class="queue-item">
            <div class="queue-name">{{ q.name }}</div>
            <div class="queue-metrics">
              <span
                >Waiting: <b>{{ q.waiting }}</b></span
              >
              <span
                >Active: <b>{{ q.active }}</b></span
              >
              <span
                >Failed: <b class="status-failed">{{ q.failed }}</b></span
              >
              <span
                >Completed:
                <b class="status-healthy">{{ q.completed }}</b></span
              >
            </div>
            <div v-if="q.recentFailed?.length" class="failed-jobs">
              <div
                v-for="job in q.recentFailed"
                :key="job.id"
                class="failed-job"
              >
                <span>#{{ job.id }} {{ job.name }}</span>
                <span class="failed-reason">{{ job.failedReason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Database</h3>
        <div v-if="dbLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="dbData" class="db-grid">
          <div class="db-item">
            <span>Connections</span>
            <b>{{ dbData.connection.total }}</b>
          </div>
          <div class="db-item">
            <span>Available</span>
            <b class="status-healthy">{{ dbData.connection.available }}</b>
          </div>
          <div class="db-item">
            <span>Waiting</span>
            <b :class="dbData.connection.waiting > 0 ? 'status-failed' : ''">{{
              dbData.connection.waiting
            }}</b>
          </div>
          <div class="db-item">
            <span>Slow Queries</span>
            <b>{{ dbData.slowQueries?.[0]?.value || 0 }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>Error Rates (24h)</h3>
        <div v-if="errorLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="errorData" class="error-grid">
          <div class="error-item">
            <span>Total Requests</span>
            <b>{{ errorData.total }}</b>
          </div>
          <div class="error-item">
            <span>4xx Errors</span>
            <b class="status-warning">{{ errorData.errors4xx }}</b>
          </div>
          <div class="error-item">
            <span>5xx Errors</span>
            <b class="status-failed">{{ errorData.errors5xx }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Integration Latency</h3>
        <div v-if="latencyLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="latencyData" class="latency-list">
          <div
            v-for="(item, key) in latencyData.integrations"
            :key="key"
            class="latency-item"
          >
            <span class="latency-name">{{ item.name }}</span>
            <span class="latency-status" :class="statusClass(item.status)">{{
              item.status
            }}</span>
            <span class="latency-ms">{{
              item.latencyMs ? item.latencyMs + "ms" : "—"
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const refreshing = ref(false);
const queueLoading = ref(false);
const queueData = ref(null);
const dbLoading = ref(false);
const dbData = ref(null);
const errorLoading = ref(false);
const errorData = ref(null);
const latencyLoading = ref(false);
const latencyData = ref(null);

const refreshAll = async () => {
  refreshing.value = true;
  try {
    await Promise.all([loadQueues, loadDb, loadErrors, loadLatency]);
  } finally {
    refreshing.value = false;
  }
};

const loadQueues = async () => {
  queueLoading.value = true;
  try {
    const res = await adminAPI.getMonitoringQueues();
    queueData.value = res.data || null;
  } finally {
    queueLoading.value = false;
  }
};

const loadDb = async () => {
  dbLoading.value = true;
  try {
    const res = await adminAPI.getMonitoringDatabase();
    dbData.value = res.data || null;
  } finally {
    dbLoading.value = false;
  }
};

const loadErrors = async () => {
  errorLoading.value = true;
  try {
    const res = await adminAPI.getMonitoringErrors();
    errorData.value = res.data || null;
  } finally {
    errorLoading.value = false;
  }
};

const loadLatency = async () => {
  latencyLoading.value = true;
  try {
    const res = await adminAPI.getMonitoringLatency();
    latencyData.value = res.data || null;
  } finally {
    latencyLoading.value = false;
  }
};

const statusClass = (status) => {
  const map = {
    healthy: "status-healthy",
    degraded: "status-warning",
    unhealthy: "status-failed",
    unknown: "status-warning",
  };
  return map[status] || "";
};

onMounted(() => {
  refreshAll();
});
</script>

<style scoped>
.monitoring-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
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
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.queue-item {
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.queue-name {
  font-weight: 700;
  color: var(--ink);
  margin-bottom: var(--space-2);
  text-transform: capitalize;
}
.queue-metrics {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-bottom: var(--space-2);
}
.failed-jobs {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.failed-job {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.failed-reason {
  color: var(--rose-600);
}
.db-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.db-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.db-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.db-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
.error-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.error-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.error-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.error-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
.latency-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.latency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.latency-name {
  font-weight: 600;
  color: var(--ink);
}
.latency-status {
  text-transform: capitalize;
  font-weight: 600;
}
.latency-ms {
  color: var(--ink-muted);
}
.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.status-failed {
  color: var(--rose-600);
}

.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
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
</style>
