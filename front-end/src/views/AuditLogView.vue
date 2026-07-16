<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted, computed } from "vue";
import auditAPI from "@/services/auditAPI";

const logs = ref([]);
const loading = ref(true);
const page = ref(1);
const pageSize = ref(25);
const total = ref(0);
const totalPages = ref(0);

const searchQuery = ref("");
const actionFilter = ref("all");
const entityFilter = ref("all");
const expandedRows = ref<Set<number>>(new Set());

const availableActions = computed(() => {
  const actions = new Set(logs.value.map((log) => log.action));
  return Array.from(actions).sort();
});

const availableEntities = computed(() => {
  const entities = new Set(logs.value.map((log) => log.entityType));
  return Array.from(entities).sort();
});

const filteredLogs = computed(() => {
  let result = [...logs.value];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter((log) => {
      const searchable = [
        log.userId,
        log.action,
        log.entityType,
        log.changes,
        log.ipAddress,
        log.userRole,
      ];
      return searchable.some(
        (field) =>
          field &&
          String(field).toLowerCase().includes(query)
      );
    });
  }

  if (actionFilter.value !== "all") {
    result = result.filter((log) => log.action === actionFilter.value);
  }

  if (entityFilter.value !== "all") {
    result = result.filter((log) => log.entityType === entityFilter.value);
  }

  return result;
});

onMounted(async () => {
  await loadLogs();
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await auditAPI.getAuditLogs({
      page: page.value,
      pageSize: pageSize.value,
    });
    logs.value = res.data.logs;
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 0;
  } catch (err) {
    console.error("Failed to load audit logs", err);
  } finally {
    loading.value = false;
  }
};

const goToPage = async (next) => {
  const target = Math.min(Math.max(1, next), totalPages.value || 1);
  if (target === page.value) return;
  page.value = target;
  await loadLogs();
};

const toggleRow = (id: number) => {
  const next = new Set(expandedRows.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedRows.value = next;
};

const isExpanded = (id: number) => expandedRows.value.has(id);

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

const getActionIcon = (action) => {
  const map = {
    created: "＋",
    updated: "✎",
    deleted: "✕",
    cancelled: "⊘",
    "logged in": "→",
    "logged out": "←",
  };
  return map[action.toLowerCase()] || "•";
};

const clearFilters = () => {
  searchQuery.value = "";
  actionFilter.value = "all";
  entityFilter.value = "all";
  page.value = 1;
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
        <div class="filters-bar">
          <div class="filter-group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search logs..."
              class="search-input"
            />
          </div>
          <div class="filter-group">
            <select v-model="actionFilter" class="filter-select">
              <option value="all">All Actions</option>
              <option
                v-for="action in availableActions"
                :key="action"
                :value="action"
              >
                {{ action }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <select v-model="entityFilter" class="filter-select">
              <option value="all">All Entities</option>
              <option
                v-for="entity in availableEntities"
                :key="entity"
                :value="entity"
              >
                {{ entity }}
              </option>
            </select>
          </div>
          <button class="clear-btn" @click="clearFilters">
            Clear
          </button>
        </div>

        <div class="table-wrapper">
          <table class="log-table">
            <thead>
              <tr>
                <th class="expand-col"></th>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Changes</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="log in filteredLogs" :key="log.id">
                <tr
                  class="log-row"
                  :class="{ expanded: isExpanded(log.id) }"
                  @click="toggleRow(log.id)"
                >
                  <td class="expand-col">
                    <span class="expand-icon" :class="{ open: isExpanded(log.id) }">▼</span>
                  </td>
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
                    >
                      <span class="action-icon">{{ getActionIcon(log.action) }}</span>
                      {{ log.action }}
                    </span>
                  </td>
                  <td>
                    <span class="type-badge">{{ log.entityType }}</span>
                    <span v-if="log.entityId" class="entity-id"
                      >#{{ log.entityId }}</span
                    >
                  </td>
                  <td class="changes-cell">
                    <span v-if="log.changes" class="changes-text">
                      {{ log.changes }}
                    </span>
                    <span v-else class="no-changes">-</span>
                  </td>
                  <td class="ip-cell">{{ log.ipAddress || "-" }}</td>
                </tr>
                <tr v-if="isExpanded(log.id)" class="detail-row">
                  <td colspan="7">
                    <div class="detail-panel">
                      <div class="detail-section">
                        <h4 class="detail-title">Details</h4>
                        <div class="detail-grid">
                          <div class="detail-item">
                            <span class="detail-label">User</span>
                            <span class="detail-value">{{ log.userId || "System" }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Role</span>
                            <span class="detail-value">{{ log.userRole || "N/A" }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">IP Address</span>
                            <span class="detail-value">{{ log.ipAddress || "-" }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label">Entity</span>
                            <span class="detail-value">{{ log.entityType }} #{{ log.entityId || "N/A" }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-if="log.changes" class="detail-section">
                        <h4 class="detail-title">Changes</h4>
                        <div class="changes-block">
                          {{ log.changes }}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="!filteredLogs.length">
                <td colspan="7" class="empty-row">No audit logs found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="pager">
          <button
            class="pager-btn"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            Previous
          </button>
          <span class="pager-info">
            Page {{ page }} of {{ totalPages }}
            <span class="pager-total">({{ total }} entries)</span>
          </span>
          <button
            class="pager-btn"
            :disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          >
            Next
          </button>
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

.filters-bar {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  flex: 1;
  min-width: 180px;
}

.search-input {
  width: 100%;
  padding: var(--space-2-5) var(--space-3-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  transition: border-color var(--duration-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.filter-select {
  width: 100%;
  padding: var(--space-2-5) var(--space-3-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent);
}

.clear-btn {
  padding: var(--space-2-5) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.clear-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
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

.log-row {
  cursor: pointer;
  transition: background-color var(--duration-fast);
}

.log-row:hover {
  background-color: var(--surface-sunken);
}

.log-row.expanded {
  background-color: var(--surface-sunken);
  border-bottom: none;
}

.expand-col {
  width: 40px;
  text-align: center;
  padding: var(--space-3-5) var(--space-2);
}

.expand-icon {
  display: inline-block;
  font-size: 10px;
  color: var(--ink-muted);
  transition: transform var(--duration-fast);
}

.expand-icon.open {
  transform: rotate(180deg);
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
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2-5);
  border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
}

.action-icon {
  font-size: 11px;
  line-height: 1;
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
  max-width: 320px;
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
  max-width: 300px;
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

.detail-row {
  background: var(--surface-sunken);
}

.detail-panel {
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail-title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3) var(--space-6);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
}

.detail-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.detail-value {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--text-sm);
  color: var(--ink);
  word-break: break-word;
}

.changes-block {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.empty-row {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-10);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding: var(--space-4);
}

.pager-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-btn:not(:disabled):hover {
  border-color: var(--accent);
  color: var(--accent);
}

.pager-info {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.pager-total {
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-btn {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
