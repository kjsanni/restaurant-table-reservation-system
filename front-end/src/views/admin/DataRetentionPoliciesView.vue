<template>
  <div class="data-retention-policies-view">
    <div class="page-header">
      <div>
        <h1>Data Retention Policies</h1>
        <p class="subtitle">Configure automated data purging workflows</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">New Policy</button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No retention policies found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Table</th>
              <th>Retention (days)</th>
              <th>Action</th>
              <th>Active</th>
              <th>Last Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="policy in items" :key="policy.id">
              <td>#{{ policy.id }}</td>
              <td>{{ policy.name }}</td>
              <td>{{ policy.tableName }}</td>
              <td>{{ policy.retentionDays }}</td>
              <td>
                <span class="badge" :class="actionClass(policy.action)">
                  {{ policy.action }}
                </span>
              </td>
              <td>{{ policy.isActive ? "Yes" : "No" }}</td>
              <td>{{ formatDate(policy.lastRunAt) }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="editPolicy(policy)">Edit</button>
                <button
                  class="btn-sm btn-danger"
                  @click="removePolicy(policy.id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedPolicy"
      class="modal-overlay"
      @click.self="selectedPolicy = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedPolicy.id ? "Edit Policy" : "New Policy" }}</h3>
          <button class="btn-close" @click="selectedPolicy = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Table Name</label>
            <input
              v-model="form.tableName"
              class="field-input"
              :disabled="!!selectedPolicy.id"
            />
          </div>
          <div class="field">
            <label>Retention Days</label>
            <input
              v-model.number="form.retentionDays"
              type="number"
              class="field-input"
            />
          </div>
          <div class="field">
            <label>Action</label>
            <select v-model="form.action" class="field-input">
              <option value="delete">Delete</option>
              <option value="archive">Archive</option>
              <option value="anonymize">Anonymize</option>
            </select>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.isActive" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedPolicy = null">
              Cancel
            </button>
            <button class="btn-primary" @click="save" :disabled="saving">
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
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
const items = ref([]);
const selectedPolicy = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const form = ref({
  name: "",
  tableName: "",
  retentionDays: 30,
  action: "delete",
  isActive: true,
});

const actionClass = (action) => {
  const map = {
    delete: "badge-danger",
    archive: "badge-info",
    anonymize: "badge-warn",
  };
  return map[action] || "badge-neutral";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listDataRetentionPolicies();
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editPolicy = (policy) => {
  selectedPolicy.value = policy;
  form.value = {
    name: policy.name,
    tableName: policy.tableName,
    retentionDays: policy.retentionDays,
    action: policy.action,
    isActive: policy.isActive ?? true,
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedPolicy.value?.id) {
      await adminAPI.updateDataRetentionPolicy(
        selectedPolicy.value.id,
        form.value
      );
    } else {
      await adminAPI.createDataRetentionPolicy(form.value);
    }
    selectedPolicy.value = null;
    form.value = {
      name: "",
      tableName: "",
      retentionDays: 30,
      action: "delete",
      isActive: true,
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removePolicy = async (id) => {
  if (!confirm("Delete this retention policy?")) return;
  await adminAPI.deleteDataRetentionPolicy(id);
  await load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.data-retention-policies-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
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

.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
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
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-xs);
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.badge-info {
  background: var(--sky-100);
  color: var(--sky-700);
}
.badge-warn {
  background: var(--amber-100);
  color: var(--amber-700);
}
.badge-danger {
  background: var(--rose-100);
  color: var(--rose-700);
}
.badge-neutral {
  background: var(--gray-100);
  color: var(--gray-700);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.modal-header h3 {
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--ink-muted);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-2);
}
.field-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
