<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted } from "vue";
import auditAPI from "@/services/auditAPI";

const logs = ref([]);
const loading = ref(true);

onMounted(async () => {
  await loadLogs();
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await auditAPI.getAuditLogs();
    logs.value = res.data.logs;
  } catch (err) {
    console.error("Failed to load audit logs", err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getActionClass = (action) => {
  if (!action) return "action-default";
  const map = {
    created: "action-create",
    updated: "action-update",
    deleted: "action-delete",
    cancelled: "action-cancel",
    "logged in": "action-login",
    "logged out": "action-logout",
  };
  const key = action.toLowerCase();
  return map[key] || "action-default";
};

const readMore = (text, maxLength = 60) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Audit Logs"
      subtitle="Track system activity and changes"
    />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading logs...</p>
      </div>
      <div v-else class="table-card">
        <div class="table-wrapper">
          <table class="log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Changes</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="time-cell">{{ formatDate(log.createdAt) }}</td>
                <td>
                  <span class="user-name">{{ log.userId }}</span>
                  <span v-if="log.userRole" class="user-role">{{
                    log.userRole
                  }}</span>
                </td>
                <td>
                  <span
                    class="action-badge"
                    :class="getActionClass(log.action)"
                    >{{ log.action }}</span
                  >
                </td>
                <td>
                  <span class="type-badge">{{ log.entityType }}</span>
                  <span v-if="log.entityId" class="entity-id"
                    >#{{ log.entityId }}</span
                  >
                </td>
                <td class="changes-cell">
                  <span
                    v-if="log.changes"
                    class="changes-text"
                    :title="log.changes"
                    >{{ readMore(log.changes, 80) }}</span
                  >
                  <span v-else class="no-changes">-</span>
                </td>
                <td class="ip-cell">{{ log.ipAddress || "-" }}</td>
              </tr>
              <tr v-if="!logs.length">
                <td colspan="6" class="empty-row">No audit logs found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-5);
  gap: var(--space-4);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.table-wrapper {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
}

.log-table th,
.log-table td {
  padding: var(--space-3-5) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.log-table th {
  background-color: var(--surface-sunken);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.log-table tbody tr:hover {
  background-color: var(--surface-sunken);
}

.log-table tbody tr:last-child td {
  border-bottom: none;
}

.type-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  background-color: var(--accent-soft);
  color: var(--accent-text);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
}

.user-name {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
}

.user-role {
  display: block;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: capitalize;
}

.action-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
}

.action-create {
  background: var(--earth-50);
  color: var(--earth-600);
}

.action-update {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.action-delete,
.action-cancel {
  background: var(--rose-50);
  color: var(--rose-600);
}

.action-login,
.action-logout {
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.action-default {
  background: var(--neutral-100);
  color: var(--ink-secondary);
}

.entity-id {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-left: var(--space-1);
}

.changes-cell {
  max-width: 300px;
}

.changes-text {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 280px;
}

.no-changes {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.ip-cell {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}

.time-cell {
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-10);
}
</style>
