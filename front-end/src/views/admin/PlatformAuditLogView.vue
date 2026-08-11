<template>
  <div class="platform-audit-log-view">
    <div class="page-header">
      <div>
        <h1>Platform Audit Log</h1>
        <p class="subtitle">
          Platform-wide audit trail for super-admin actions
        </p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">
        No audit logs found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Tenant</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDate(log.createdAt) }}</td>
              <td>{{ log.actorUserId || "—" }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.entityType || "—" }}</td>
              <td>{{ log.entityId || "—" }}</td>
              <td>{{ log.tenantId || "—" }}</td>
              <td>{{ log.ipAddress || "—" }}</td>
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
const logs = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getPlatformAuditLog();
    logs.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.platform-audit-log-view {
  padding: var(--space-6);
}
.page-header {
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
