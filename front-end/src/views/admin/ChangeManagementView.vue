<template>
  <div class="change-management-view">
    <div class="page-header">
      <div>
        <h1>Change Management</h1>
        <p class="subtitle">Platform configuration and policy changes</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="filters">
      <select v-model="actionFilter" class="filter-select" @change="load">
        <option value="">All Changes</option>
        <option value="maintenance">Maintenance Mode</option>
        <option value="feature_flag">Feature Flags</option>
        <option value="retention">Data Retention</option>
        <option value="incident">Incidents</option>
        <option value="subprocessor">Sub-Processors</option>
        <option value="trust">Trust & Safety</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">
        No changes recorded
      </div>
      <div v-else class="timeline">
        <div v-for="log in logs" :key="log.id" class="timeline-item">
          <div class="timeline-marker" :class="severityClass(log.action)"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-action">{{ log.action }}</span>
              <span class="timeline-time">{{ formatDate(log.createdAt) }}</span>
            </div>
            <div class="timeline-details">
              <span>User: {{ log.userId }}</span>
              <span>Entity: {{ log.entityType }} #{{ log.entityId }}</span>
            </div>
            <div v-if="log.changes" class="timeline-changes">
              <pre>{{ JSON.stringify(log.changes, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const logs = ref([]);
const actionFilter = ref("");

const load = async () => {
  loading.value = true;
  try {
    const params = { limit: 50, sortBy: "createdAt", sortOrder: "DESC" };
    if (actionFilter.value) params.action = actionFilter.value;
    const res = await adminAPI.getAuditLogs(params);
    logs.value = res.data?.logs || [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const severityClass = (action) => {
  if (action.includes("incident") || action.includes("lock"))
    return "status-failed";
  if (action.includes("maintenance") || action.includes("feature_flag"))
    return "status-warning";
  return "status-healthy";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.change-management-view {
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
.filters {
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.timeline-item {
  display: flex;
  gap: var(--space-3);
}
.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: var(--space-2);
  flex-shrink: 0;
}
.status-healthy {
  color: var(--earth-600);
}
.status-healthy .timeline-marker {
  background: var(--earth-500);
}
.status-warning {
  color: var(--accent-600);
}
.status-warning .timeline-marker {
  background: var(--accent-500);
}
.status-failed {
  color: var(--rose-600);
}
.status-failed .timeline-marker {
  background: var(--rose-500);
}
.timeline-content {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}
.timeline-action {
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
}
.timeline-time {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.timeline-details {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin-bottom: var(--space-2);
}
.timeline-changes {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}
.timeline-changes pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: pre-wrap;
  word-break: break-word;
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>
