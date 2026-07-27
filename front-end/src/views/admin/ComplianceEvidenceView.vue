<template>
  <div class="compliance-view">
    <div class="page-header">
      <div>
        <h1>Compliance Readiness</h1>
        <p class="subtitle">
          SOC 2, ISO 27001, GDPR, and DPA 2012 evidence tracker
        </p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Evidence" }}
      </button>
    </div>

    <div class="filters">
      <select v-model="filters.framework" class="filter-select" @change="load">
        <option value="">All Frameworks</option>
        <option value="SOC2">SOC 2</option>
        <option value="ISO27001">ISO 27001</option>
        <option value="GDPR">GDPR</option>
        <option value="DPA2012">DPA 2012</option>
      </select>
      <select v-model="filters.status" class="filter-select" @change="load">
        <option value="">All Statuses</option>
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No compliance evidence found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Framework</th>
              <th>Control ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.framework }}</td>
              <td>{{ item.controlId }}</td>
              <td>{{ item.title }}</td>
              <td>
                <span class="badge" :class="statusClass(item.status)">
                  {{ item.status.replace("_", " ") }}
                </span>
              </td>
              <td>{{ item.owner || "—" }}</td>
              <td>{{ formatDate(item.dueDate) }}</td>
              <td>
                <button
                  class="btn-xs"
                  @click="editItem(item)"
                  :disabled="editingId === item.id"
                >
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(item)"
                  :disabled="deletingId === item.id"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>{{ editingItem ? "Edit Evidence" : "New Compliance Evidence" }}</h3>
        <div class="form-grid">
          <label>
            <span>Framework</span>
            <select v-model="form.framework" class="input">
              <option value="SOC2">SOC 2</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="GDPR">GDPR</option>
              <option value="DPA2012">DPA 2012</option>
            </select>
          </label>
          <label>
            <span>Control ID</span>
            <input v-model="form.controlId" type="text" class="input" />
          </label>
          <label>
            <span>Title</span>
            <input v-model="form.title" type="text" class="input" />
          </label>
          <label>
            <span>Description</span>
            <textarea
              v-model="form.description"
              rows="3"
              class="input"
            ></textarea>
          </label>
          <label>
            <span>Status</span>
            <select v-model="form.status" class="input">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <label>
            <span>Owner</span>
            <input v-model="form.owner" type="text" class="input" />
          </label>
          <label>
            <span>Due Date</span>
            <input v-model="form.dueDate" type="date" class="input" />
          </label>
          <label>
            <span>Evidence URL</span>
            <input v-model="form.evidenceUrl" type="text" class="input" />
          </label>
          <label>
            <span>Notes</span>
            <textarea v-model="form.notes" rows="3" class="input"></textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="save" :disabled="saving">
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
const creating = ref(false);
const saving = ref(false);
const editingId = ref(null);
const deletingId = ref(null);
const items = ref([]);
const showForm = ref(false);
const editingItem = ref(null);
const filters = ref({ framework: "", status: "" });
const form = ref({
  framework: "SOC2",
  controlId: "",
  title: "",
  description: "",
  status: "not_started",
  owner: "",
  dueDate: "",
  evidenceUrl: "",
  notes: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listComplianceEvidence(filters.value);
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingItem.value = null;
  editingId.value = null;
  form.value = {
    framework: "SOC2",
    controlId: "",
    title: "",
    description: "",
    status: "not_started",
    owner: "",
    dueDate: "",
    evidenceUrl: "",
    notes: "",
  };
  showForm.value = true;
};

const editItem = (item) => {
  editingItem.value = item;
  editingId.value = item.id;
  form.value = { ...item };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingItem.value = null;
  editingId.value = null;
};

const save = async () => {
  saving.value = true;
  try {
    if (editingItem.value) {
      await adminAPI.updateComplianceEvidence(editingItem.value.id, form.value);
    } else {
      await adminAPI.createComplianceEvidence(form.value);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const remove = async (item) => {
  if (!window.confirm(`Delete compliance evidence "${item.title}"?`)) return;
  deletingId.value = item.id;
  try {
    await adminAPI.deleteComplianceEvidence(item.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const statusClass = (status) => {
  const map = {
    not_started: "status-failed",
    in_progress: "status-warning",
    completed: "status-healthy",
    failed: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.compliance-view {
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
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
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
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
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
.btn-xs:disabled {
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 640px;
  box-shadow: var(--shadow-lg);
}
.modal h3 {
  margin: 0 0 var(--space-4) 0;
}
.form-grid {
  display: grid;
  gap: var(--space-4);
}
.form-grid label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.form-grid label span {
  font-weight: 600;
  color: var(--ink);
}
.input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-sm);
}
.modal-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-4);
}
</style>
