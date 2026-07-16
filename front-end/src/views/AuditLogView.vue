<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
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
const dateFrom = ref("");
const dateTo = ref("");
const expandedRows = ref<Set<number>>(new Set());
const selectedIds = ref<Set<number>>(new Set());

const sortBy = ref("createdAt");
const sortOrder = ref<"ASC" | "DESC">("DESC");

const stats = ref({
  byAction: [],
  byEntity: [],
  topUsers: [],
  total: 0,
});
const showStats = ref(false);

let pollInterval = null;

const availableActions = computed(() => {
  const actions = new Set(logs.value.map((log) => log.action));
  return Array.from(actions).sort();
});

const availableEntities = computed(() => {
  const entities = new Set(logs.value.map((log) => log.entityType));
  return Array.from(entities).sort();
});

const filteredLogs = computed(() => {
  return [...logs.value];
});

const selectedCount = computed(() => selectedIds.value.size);
const allSelected = computed(() => filteredLogs.value.length > 0 && selectedIds.value.size === filteredLogs.value.length);

watch(
  [searchQuery, actionFilter, entityFilter, dateFrom, dateTo, sortBy, sortOrder],
  () => {
    page.value = 1;
    loadLogs();
  }
);

watch(showStats, async (val) => {
  if (val) {
    await loadStats();
  }
});

onMounted(async () => {
  await loadLogs();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

const startPolling = () => {
  stopPolling();
  pollInterval = setInterval(async () => {
    await loadLogs(false);
  }, 30000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const loadLogs = async (showLoading = true) => {
  if (showLoading) loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    };
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (actionFilter.value !== "all") params.action = actionFilter.value;
    if (entityFilter.value !== "all") params.entityType = entityFilter.value;
    if (dateFrom.value) params.from = dateFrom.value;
    if (dateTo.value) params.to = dateTo.value;

    const res = await auditAPI.getAuditLogs(params);
    logs.value = res.data.logs;
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 0;
  } catch (err) {
    console.error("Failed to load audit logs", err);
  } finally {
    if (showLoading) loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const params: any = {};
    if (dateFrom.value) params.from = dateFrom.value;
    if (dateTo.value) params.to = dateTo.value;
    if (actionFilter.value !== "all") params.action = actionFilter.value;
    if (entityFilter.value !== "all") params.entityType = entityFilter.value;

    stats.value = await auditAPI.getStats(params);
  } catch (err) {
    console.error("Failed to load stats", err);
  }
};

const goToPage = async (next) => {
  const target = Math.min(Math.max(1, next), totalPages.value || 1);
  if (target === page.value) return;
  page.value = target;
  selectedIds.value.clear();
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

const toggleSelect = (id: number) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  selectedIds.value = next;
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedIds.value.clear();
  } else {
    selectedIds.value = new Set(filteredLogs.value.map((log) => log.id));
  }
};

const handleSort = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "ASC" ? "DESC" : "ASC";
  } else {
    sortBy.value = column;
    sortOrder.value = "DESC";
  }
  loadLogs();
};

const getSortIcon = (column) => {
  if (sortBy.value !== column) return "↕";
  return sortOrder.value === "ASC" ? "↑" : "↓";
};

const clearFilters = () => {
  searchQuery.value = "";
  actionFilter.value = "all";
  entityFilter.value = "all";
  dateFrom.value = "";
  dateTo.value = "";
  page.value = 1;
  selectedIds.value.clear();
};

const handleBulkDelete = async () => {
  if (!selectedCount.value) return;
  if (!confirm(`Delete ${selectedCount.value} selected audit log(s)? This cannot be undone.`)) return;

  try {
    await auditAPI.bulkDelete(Array.from(selectedIds.value));
    selectedIds.value.clear();
    await loadLogs();
  } catch (err) {
    console.error("Failed to delete logs", err);
    alert("Failed to delete selected logs");
  }
};

const handleExportCSV = async () => {
  try {
    const blob = await auditAPI.exportCSV({
      search: searchQuery.value || undefined,
      action: actionFilter.value !== "all" ? actionFilter.value : undefined,
      entityType: entityFilter.value !== "all" ? entityFilter.value : undefined,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
    });
    downloadBlob(blob, "audit-logs.csv", "text/csv");
  } catch (err) {
    console.error("Failed to export CSV", err);
    alert("Failed to export CSV");
  }
};

const handleExportJSON = async () => {
  try {
    const blob = await auditAPI.exportJSON({
      search: searchQuery.value || undefined,
      action: actionFilter.value !== "all" ? actionFilter.value : undefined,
      entityType: entityFilter.value !== "all" ? entityFilter.value : undefined,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
    });
    downloadBlob(blob, "audit-logs.json", "application/json");
  } catch (err) {
    console.error("Failed to export JSON", err);
    alert("Failed to export JSON");
  }
};

const downloadBlob = (blob, filename, mimeType) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
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
            <input
              v-model="dateFrom"
              type="date"
              placeholder="From"
              class="filter-date"
            />
          </div>
          <div class="filter-group">
            <input
              v-model="dateTo"
              type="date"
              placeholder="To"
              class="filter-date"
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

        <div class="actions-bar">
          <div class="bulk-actions">
            <button
              class="action-btn delete-btn"
              :disabled="!selectedCount"
              @click="handleBulkDelete"
            >
              Delete Selected ({{ selectedCount }})
            </button>
          </div>
          <div class="export-actions">
            <button class="action-btn export-btn" @click="handleExportCSV">
              Export CSV
            </button>
            <button class="action-btn export-btn" @click="handleExportJSON">
              Export JSON
            </button>
          </div>
          <button
            class="action-btn stats-btn"
            :class="{ active: showStats }"
            @click="showStats = !showStats"
          >
            {{ showStats ? "Hide Stats" : "Show Stats" }}
          </button>
        </div>

        <div v-if="showStats" class="stats-panel">
          <div class="stats-grid">
            <div class="stat-card">
              <h4>Total Logs</h4>
              <p class="stat-value">{{ stats.total }}</p>
            </div>
            <div class="stat-card">
              <h4>By Action</h4>
              <ul class="stat-list">
                <li v-for="item in stats.byAction" :key="item.action">
                  <span>{{ item.action }}</span>
                  <span class="stat-count">{{ item.count }}</span>
                </li>
              </ul>
            </div>
            <div class="stat-card">
              <h4>By Entity</h4>
              <ul class="stat-list">
                <li v-for="item in stats.byEntity" :key="item.entityType">
                  <span>{{ item.entityType }}</span>
                  <span class="stat-count">{{ item.count }}</span>
                </li>
              </ul>
            </div>
            <div class="stat-card">
              <h4>Top Users</h4>
              <ul class="stat-list">
                <li v-for="item in stats.topUsers" :key="item.userId">
                  <span>{{ item.userId }}</span>
                  <span class="stat-count">{{ item.count }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="log-table">
            <thead>
              <tr>
                <th class="select-col">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="expand-col"></th>
                <th @click="handleSort('createdAt')" class="sortable">
                  Time {{ getSortIcon("createdAt") }}
                </th>
                <th @click="handleSort('userId')" class="sortable">
                  User {{ getSortIcon("userId") }}
                </th>
                <th @click="handleSort('action')" class="sortable">
                  Action {{ getSortIcon("action") }}
                </th>
                <th @click="handleSort('entityType')" class="sortable">
                  Entity {{ getSortIcon("entityType") }}
                </th>
                <th>Changes</th>
                <th @click="handleSort('ipAddress')" class="sortable">
                  IP Address {{ getSortIcon("ipAddress") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="log in filteredLogs" :key="log.id">
                <tr
                  class="log-row"
                  :class="{ expanded: isExpanded(log.id) }"
                  @click="toggleRow(log.id)"
                >
                  <td class="select-col" @click.stop>
                    <input
                      type="checkbox"
                      :checked="selectedIds.has(log.id)"
                      @change="toggleSelect(log.id)"
                    />
                  </td>
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
                  <td colspan="8">
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
                <td colspan="8" class="empty-row">No audit logs found</td>
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

.search-input,
.filter-date,
.filter-select {
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

.search-input:focus,
.filter-date:focus,
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

.actions-bar {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.bulk-actions,
.export-actions {
  display: flex;
  gap: var(--space-2);
}

.action-btn {
  padding: var(--space-2) var(--space-3-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.delete-btn {
  background: var(--rose-50);
  color: var(--rose-600);
  border-color: var(--rose-200);
}

.delete-btn:hover:not(:disabled) {
  background: var(--rose-100);
}

.export-btn {
  background: var(--surface);
  color: var(--ink);
}

.export-btn:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.stats-btn {
  background: var(--surface);
  color: var(--ink);
}

.stats-btn.active {
  background: var(--accent-soft);
  color: var(--accent-text);
  border-color: var(--accent);
}

.stats-panel {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.stat-card h4 {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
  margin: 0 0 var(--space-2) 0;
}

.stat-value {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-2xl);
  color: var(--ink);
  margin: 0;
}

.stat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-list li {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--ink);
}

.stat-count {
  font-weight: 600;
  color: var(--ink-secondary);
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

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  color: var(--accent);
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

.select-col {
  width: 40px;
  text-align: center;
  padding: var(--space-3-5) var(--space-2);
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

  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .bulk-actions,
  .export-actions {
    width: 100%;
  }

  .action-btn {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
