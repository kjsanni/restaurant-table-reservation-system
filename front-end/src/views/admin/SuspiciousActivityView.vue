<template>
  <div class="suspicious-view">
    <div class="page-header">
      <div>
        <h1>Suspicious Activity</h1>
        <p class="subtitle">
          Brute force attempts, account lockouts, and anomalies
        </p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No suspicious activity detected
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Email / User</th>
              <th>IP Address</th>
              <th>Details</th>
              <th>Severity</th>
              <th>Detected At</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id || item.email + item.ipAddress"
            >
              <td class="text-capitalize">
                {{ item.type?.replace("_", " ") }}
              </td>
              <td>{{ item.email || item.userId || "—" }}</td>
              <td>{{ item.ipAddress || "—" }}</td>
              <td>
                <span v-if="item.attempts">
                  {{ item.attempts }} attempts from {{ item.distinctIps }} IPs
                </span>
                <span v-else-if="item.lockedAt"> Locked out </span>
                <span v-else> — </span>
              </td>
              <td>
                <span class="badge" :class="severityClass(item.severity)">{{
                  item.severity
                }}</span>
              </td>
              <td>{{ formatDate(item.lockedAt || item.createdAt) }}</td>
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
const items = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getSuspiciousActivity();
    items.value = res.data?.suspicious || [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const severityClass = (severity) => {
  const map = {
    low: "status-healthy",
    medium: "status-warning",
    high: "status-failed",
    critical: "status-failed",
  };
  return map[severity] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.suspicious-view {
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
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
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
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
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
