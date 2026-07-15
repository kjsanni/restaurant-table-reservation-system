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
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--color-info-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-card {
  background: var(--surface);
  border: 1px solid #f0f0f0;
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
  font-family: "Inter-Light";
  font-size: 14px;
}

.log-table th,
.log-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.log-table th {
  background-color: #fafafa;
  color: var(--ink-muted);
  font-family: "Inter-Medium";
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}

.log-table tbody tr:hover {
  background-color: #fafafa;
}

.log-table tbody tr:last-child td {
  border-bottom: none;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #eef2ff;
  color: var(--color-info-600);
  font-family: "Inter-Medium";
  font-size: 12px;
}

.user-name {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--ink);
}

.user-role {
  display: block;
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--ink-muted);
  text-transform: capitalize;
}

.action-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Inter-Medium";
  font-size: 12px;
  font-weight: 500;
}

.action-create {
  background: #d1fae5;
  color: #065f46;
}

.action-update {
  background: #dbeafe;
  color: #1e40af;
}

.action-delete,
.action-cancel {
  background: #fee2e2;
  color: #991b1b;
}

.action-login,
.action-logout {
  background: #f3f4f6;
  color: #374151;
}

.action-default {
  background: #f3f4f6;
  color: #374151;
}

.entity-id {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--ink-muted);
  margin-left: 4px;
}

.changes-cell {
  max-width: 300px;
}

.changes-text {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 280px;
}

.no-changes {
  color: var(--ink-muted);
  font-size: 13px;
}

.ip-cell {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--ink-muted);
}

.time-cell {
  white-space: nowrap;
}

.empty-row {
  text-align: center;
  color: var(--ink-muted);
  padding: 40px;
}
</style>
