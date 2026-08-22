<template>
  <div class="insurance-documents-view">
    <div class="page-header">
      <div>
        <h1>Insurance Documents</h1>
        <p class="subtitle">Track insurance policies and liability coverage</p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Document" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="documents.length === 0" class="empty-state">
        No insurance documents
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Insurer</th>
              <th>Policy</th>
              <th>Coverage</th>
              <th>Start</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="document in documents" :key="document.id">
              <td>{{ document.title }}</td>
              <td>{{ document.insurer || "—" }}</td>
              <td>{{ document.policyNumber || "—" }}</td>
              <td>{{ document.coverageType || "—" }}</td>
              <td>{{ formatDate(document.startDate) }}</td>
              <td>{{ formatDate(document.expiryDate) }}</td>
              <td>
                <span class="badge" :class="statusClass(document.status)">
                  {{ document.status }}
                </span>
              </td>
              <td>
                <button
                  class="btn-xs"
                  @click="editDocument(document)"
                  :disabled="updatingId === document.id"
                >
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(document)"
                  :disabled="deletingId === document.id"
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
        <h3>
          {{ editingDocument ? "Edit Document" : "New Insurance Document" }}
        </h3>
        <div class="form-grid">
          <label>
            <span>Title</span>
            <input v-model="form.title" type="text" class="input" />
          </label>
          <label>
            <span>Insurer</span>
            <input v-model="form.insurer" type="text" class="input" />
          </label>
          <label>
            <span>Policy Number</span>
            <input v-model="form.policyNumber" type="text" class="input" />
          </label>
          <label>
            <span>Coverage Type</span>
            <input
              v-model="form.coverageType"
              type="text"
              class="input"
              placeholder="General Liability, Professional Indemnity..."
            />
          </label>
          <label>
            <span>Start Date</span>
            <input v-model="form.startDate" type="date" class="input" />
          </label>
          <label>
            <span>Expiry Date</span>
            <input v-model="form.expiryDate" type="date" class="input" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="form.status" class="input">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <label>
            <span>File Path</span>
            <input
              v-model="form.filePath"
              type="text"
              class="input"
              placeholder="/path/to/policy.pdf"
            />
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
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const creating = ref(false);
const saving = ref(false);
const updatingId = ref(null);
const deletingId = ref(null);
const documents = ref([]);
const showForm = ref(false);
const editingDocument = ref(null);
const form = ref({
  title: "",
  insurer: "",
  policyNumber: "",
  coverageType: "",
  startDate: "",
  expiryDate: "",
  status: "pending",
  filePath: "",
  notes: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listInsuranceDocuments();
    documents.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingDocument.value = null;
  form.value = {
    title: "",
    insurer: "",
    policyNumber: "",
    coverageType: "",
    startDate: "",
    expiryDate: "",
    status: "pending",
    filePath: "",
    notes: "",
  };
  showForm.value = true;
};

const editDocument = (document) => {
  editingDocument.value = document;
  form.value = {
    title: document.title,
    insurer: document.insurer || "",
    policyNumber: document.policyNumber || "",
    coverageType: document.coverageType || "",
    startDate: document.startDate
      ? new Date(document.startDate).toISOString().slice(0, 10)
      : "",
    expiryDate: document.expiryDate
      ? new Date(document.expiryDate).toISOString().slice(0, 10)
      : "",
    status: document.status,
    filePath: document.filePath || "",
    notes: document.notes || "",
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingDocument.value = null;
};

const save = async () => {
  saving.value = true;
  try {
    if (editingDocument.value) {
      await adminAPI.updateInsuranceDocument(
        editingDocument.value.id,
        form.value
      );
    } else {
      await adminAPI.createInsuranceDocument(form.value);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const remove = async (document) => {
  if (!window.confirm(`Delete "${document.title}"?`)) return;
  deletingId.value = document.id;
  try {
    await adminAPI.deleteInsuranceDocument(document.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const statusClass = (status) => {
  const map = {
    pending: "status-warning",
    active: "status-healthy",
    expired: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.insurance-documents-view {
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
