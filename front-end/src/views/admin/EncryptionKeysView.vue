<template>
  <div class="encryption-keys-view">
    <div class="page-header">
      <div>
        <h1>Encryption Keys</h1>
        <p class="subtitle">
          Manage encryption keys, rotation, and access audit
        </p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Key" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="keys.length === 0" class="empty-state">
        No encryption keys
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Algorithm</th>
              <th>Status</th>
              <th>Last Rotated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in keys" :key="key.id">
              <td>{{ key.name }}</td>
              <td>{{ key.purpose }}</td>
              <td>{{ key.algorithm }}</td>
              <td>
                <span class="badge" :class="statusClass(key.status)">
                  {{ key.status }}
                </span>
              </td>
              <td>{{ formatDate(key.lastRotatedAt) }}</td>
              <td>
                <button
                  class="btn-xs"
                  @click="rotate(key)"
                  :disabled="rotatingId === key.id || key.status === 'rotating'"
                >
                  Rotate
                </button>
                <button
                  class="btn-xs"
                  @click="retire(key)"
                  :disabled="retiringId === key.id || key.status !== 'active'"
                >
                  Retire
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(key)"
                  :disabled="deletingId === key.id"
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
        <h3>{{ editingKey ? "Edit Key" : "New Encryption Key" }}</h3>
        <div class="form-grid">
          <label>
            <span>Name</span>
            <input v-model="form.name" type="text" class="input" />
          </label>
          <label>
            <span>Purpose</span>
            <select v-model="form.purpose" class="input">
              <option value="data_at_rest">Data at Rest</option>
              <option value="session">Session</option>
              <option value="api">API</option>
              <option value="backup">Backup</option>
            </select>
          </label>
          <label>
            <span>Algorithm</span>
            <input v-model="form.algorithm" type="text" class="input" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="form.status" class="input">
              <option value="active">Active</option>
              <option value="rotating">Rotating</option>
              <option value="retired">Retired</option>
            </select>
          </label>
          <label>
            <span>Metadata (JSON)</span>
            <textarea
              v-model="form.metadata"
              rows="3"
              class="input"
              placeholder='{"owner":"platform"}'
            ></textarea>
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
const rotatingId = ref(null);
const retiringId = ref(null);
const deletingId = ref(null);
const keys = ref([]);
const showForm = ref(false);
const editingKey = ref(null);
const form = ref({
  name: "",
  purpose: "data_at_rest",
  algorithm: "AES-256-GCM",
  status: "active",
  metadata: null,
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listEncryptionKeys();
    keys.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingKey.value = null;
  form.value = {
    name: "",
    purpose: "data_at_rest",
    algorithm: "AES-256-GCM",
    status: "active",
    metadata: null,
  };
  showForm.value = true;
};

const editKey = (key) => {
  editingKey.value = key;
  form.value = {
    name: key.name,
    purpose: key.purpose,
    algorithm: key.algorithm,
    status: key.status,
    metadata: key.metadata || null,
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingKey.value = null;
};

const save = async () => {
  saving.value = true;
  try {
    if (editingKey.value) {
      await adminAPI.updateEncryptionKey(editingKey.value.id, form.value);
    } else {
      await adminAPI.createEncryptionKey(form.value);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const rotate = async (key) => {
  if (!window.confirm(`Rotate encryption key "${key.name}"?`)) return;
  rotatingId.value = key.id;
  try {
    await adminAPI.rotateEncryptionKey(key.id);
    await load();
  } finally {
    rotatingId.value = null;
  }
};

const retire = async (key) => {
  if (!window.confirm(`Retire encryption key "${key.name}"?`)) return;
  retiringId.value = key.id;
  try {
    await adminAPI.retireEncryptionKey(key.id);
    await load();
  } finally {
    retiringId.value = null;
  }
};

const remove = async (key) => {
  if (!window.confirm(`Delete encryption key "${key.name}"?`)) return;
  deletingId.value = key.id;
  try {
    await adminAPI.deleteEncryptionKey(key.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const statusClass = (status) => {
  const map = {
    active: "status-healthy",
    rotating: "status-warning",
    retired: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.encryption-keys-view {
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
