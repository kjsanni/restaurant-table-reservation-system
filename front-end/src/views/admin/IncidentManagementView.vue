<template>
  <div class="incidents-view">
    <div class="page-header">
      <div>
        <h1>Incidents</h1>
        <p class="subtitle">Security incidents and response tracking</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        New Incident
      </button>
    </div>

    <div class="dashboard-summary">
      <div class="summary-card">
        <div class="summary-label">Active</div>
        <div class="summary-value">{{ activeCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Critical</div>
        <div class="summary-value">{{ criticalCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Resolved</div>
        <div class="summary-value">{{ resolvedCount }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Closed</div>
        <div class="summary-value">{{ closedCount }}</div>
      </div>
    </div>

    <div class="filters">
      <select v-model="filters.status" class="filter-select" @change="load">
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <select v-model="filters.severity" class="filter-select" @change="load">
        <option value="">All Severities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="incidents.length === 0" class="empty-state">
        No incidents found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Tenant</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="incident in incidents" :key="incident.id">
              <td>#{{ incident.id }}</td>
              <td>{{ incident.title }}</td>
              <td>
                <span class="badge" :class="severityClass(incident.severity)">{{
                  incident.severity
                }}</span>
              </td>
              <td>
                <span class="badge" :class="statusClass(incident.status)">{{
                  incident.status
                }}</span>
              </td>
              <td>{{ incident.tenant?.name || "Platform" }}</td>
              <td>{{ formatDate(incident.createdAt) }}</td>
              <td>
                <button class="btn-xs" @click="editIncident(incident)">
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="deleteIncident(incident.id)"
                >
                  Delete
                </button>
                <template v-if="incident.tenantId">
                  <button
                    class="btn-xs"
                    :disabled="actionLoading[incident.id]?.lock"
                    @click="lockTenant(incident)"
                  >
                    {{
                      actionLoading[incident.id]?.lock
                        ? "Locking..."
                        : "Lock Tenant"
                    }}
                  </button>
                  <button
                    class="btn-xs"
                    :disabled="actionLoading[incident.id]?.reset"
                    @click="resetTokens(incident)"
                  >
                    {{
                      actionLoading[incident.id]?.reset
                        ? "Resetting..."
                        : "Reset Tokens"
                    }}
                  </button>
                  <button
                    class="btn-xs"
                    :disabled="actionLoading[incident.id]?.logout"
                    @click="forceLogout(incident)"
                  >
                    {{
                      actionLoading[incident.id]?.logout
                        ? "Logging out..."
                        : "Force Logout"
                    }}
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showCreate || editingIncident"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div class="modal">
        <h3>{{ editingIncident ? "Edit Incident" : "New Incident" }}</h3>
        <div class="form-group">
          <label>Title</label>
          <input
            v-model="form.title"
            class="filter-select"
            placeholder="Incident title"
          />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea
            v-model="form.description"
            class="filter-select"
            rows="3"
            placeholder="Details..."
          ></textarea>
        </div>
        <div class="form-group">
          <label>Severity</label>
          <select v-model="form.severity" class="filter-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="filter-select">
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn-primary"
            @click="saveIncident"
            :disabled="saving || !form.title"
          >
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const saving = ref(false);
const incidents = ref([]);
const showCreate = ref(false);
const editingIncident = ref(null);
const filters = ref({ status: "", severity: "" });
const form = ref({
  title: "",
  description: "",
  severity: "medium",
  status: "open",
});
const actionLoading = ref({});

const activeCount = ref(0);
const criticalCount = ref(0);
const resolvedCount = ref(0);
const closedCount = ref(0);

const load = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.severity) params.severity = filters.value.severity;
    const res = await adminAPI.listIncidents(params);
    const collection = res.data?.collection || [];
    incidents.value = collection;
    activeCount.value = collection.filter(
      (i) => i.status !== "resolved" && i.status !== "closed"
    ).length;
    criticalCount.value = collection.filter(
      (i) => i.severity === "critical"
    ).length;
    resolvedCount.value = collection.filter(
      (i) => i.status === "resolved"
    ).length;
    closedCount.value = collection.filter((i) => i.status === "closed").length;
  } finally {
    loading.value = false;
  }
};

const saveIncident = async () => {
  saving.value = true;
  try {
    if (editingIncident.value) {
      await adminAPI.updateIncident(editingIncident.value.id, form.value);
    } else {
      await adminAPI.createIncident(form.value);
    }
    closeModal();
    await load();
  } finally {
    saving.value = false;
  }
};

const editIncident = (incident) => {
  editingIncident.value = incident;
  form.value = { ...incident };
  showCreate.value = true;
};

const deleteIncident = async (id) => {
  const confirmed = window.confirm("Delete this incident?");
  if (!confirmed) return;
  await adminAPI.deleteIncident(id);
  await load();
};

const lockTenant = async (incident) => {
  const confirmed = window.confirm(
    `Lock tenant "${incident.tenant?.name || incident.tenantId}"? This will suspend the tenant.`
  );
  if (!confirmed) return;
  actionLoading.value[incident.id] = {
    ...actionLoading.value[incident.id],
    lock: true,
  };
  try {
    await adminAPI.lockTenant(incident.tenantId);
    await load();
  } finally {
    actionLoading.value[incident.id] = {
      ...actionLoading.value[incident.id],
      lock: false,
    };
  }
};

const resetTokens = async (incident) => {
  const confirmed = window.confirm(
    `Reset all tokens for tenant "${incident.tenant?.name || incident.tenantId}"? All users will be logged out.`
  );
  if (!confirmed) return;
  actionLoading.value[incident.id] = {
    ...actionLoading.value[incident.id],
    reset: true,
  };
  try {
    await adminAPI.resetTenantTokens(incident.tenantId);
    await load();
  } finally {
    actionLoading.value[incident.id] = {
      ...actionLoading.value[incident.id],
      reset: false,
    };
  }
};

const forceLogout = async (incident) => {
  const confirmed = window.confirm(
    `Force logout all sessions for tenant "${incident.tenant?.name || incident.tenantId}"?`
  );
  if (!confirmed) return;
  actionLoading.value[incident.id] = {
    ...actionLoading.value[incident.id],
    logout: true,
  };
  try {
    await adminAPI.forceLogoutTenant(incident.tenantId);
    await load();
  } finally {
    actionLoading.value[incident.id] = {
      ...actionLoading.value[incident.id],
      logout: false,
    };
  }
};

const closeModal = () => {
  showCreate.value = false;
  editingIncident.value = null;
  form.value = {
    title: "",
    description: "",
    severity: "medium",
    status: "open",
  };
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

const statusClass = (status) => {
  const map = {
    open: "status-failed",
    investigating: "status-warning",
    resolved: "status-healthy",
    closed: "status-healthy",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.incidents-view {
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
  display: flex;
  gap: var(--space-3);
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
.dashboard-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.summary-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-sm);
}
.summary-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.summary-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
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
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-danger {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: 600;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-xs {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: 600;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}
.modal h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
}
.form-group {
  margin-bottom: var(--space-3);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: var(--space-1);
}
.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
textarea.filter-select {
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
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
