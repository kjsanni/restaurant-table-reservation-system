<template>
  <div class="data-retention-view">
    <div class="page-header">
      <div>
        <h1>Data Retention</h1>
        <p class="subtitle">
          Manage data retention policies and execute cleanup
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showCreate = true">
          New Policy
        </button>
        <button class="btn-secondary" @click="executeAll" :disabled="executing">
          {{ executing ? "Running..." : "Run Cleanup" }}
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="policies.length === 0" class="empty-state">
        No retention policies configured
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Retention (days)</th>
              <th>Action</th>
              <th>Active</th>
              <th>Last Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="policy in policies" :key="policy.id">
              <td>{{ policy.name }}</td>
              <td>
                <span class="badge">{{ policy.dataCategory }}</span>
              </td>
              <td>{{ policy.retentionDays }}</td>
              <td class="text-capitalize">{{ policy.action }}</td>
              <td>
                <span
                  class="badge"
                  :class="policy.isActive ? 'status-healthy' : 'status-failed'"
                >
                  {{ policy.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td>{{ formatDate(policy.lastRunAt) }}</td>
              <td>
                <button class="btn-xs" @click="editPolicy(policy)">Edit</button>
                <button
                  class="btn-xs btn-danger"
                  @click="deletePolicy(policy.id)"
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
      v-if="showCreate || editingPolicy"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div class="modal">
        <h3>{{ editingPolicy ? "Edit Policy" : "New Policy" }}</h3>
        <div class="form-group">
          <label>Name</label>
          <input
            v-model="form.name"
            class="filter-select"
            placeholder="e.g. Audit Log Retention"
          />
        </div>
        <div class="form-group">
          <label>Data Category</label>
          <select v-model="form.dataCategory" class="filter-select">
            <option value="platform_audit_logs">Audit Logs</option>
            <option value="support_messages">Support Messages</option>
            <option value="support_conversations">Support Conversations</option>
            <option value="support_tickets">Support Tickets</option>
          </select>
        </div>
        <div class="form-group">
          <label>Retention (days)</label>
          <input
            v-model.number="form.retentionDays"
            type="number"
            class="filter-select"
            placeholder="e.g. 90"
          />
        </div>
        <div class="form-group">
          <label>Action</label>
          <select v-model="form.action" class="filter-select">
            <option value="delete">Delete</option>
            <option value="anonymize">Anonymize</option>
            <option value="archive">Archive</option>
          </select>
        </div>
        <div class="form-group">
          <label>Active</label>
          <select v-model="form.isActive" class="filter-select">
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn-primary"
            @click="savePolicy"
            :disabled="saving || !form.name || !form.retentionDays"
          >
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
const saving = ref(false);
const executing = ref(false);
const policies = ref([]);
const showCreate = ref(false);
const editingPolicy = ref(null);
const form = ref({
  name: "",
  dataCategory: "platform_audit_logs",
  retentionDays: 90,
  action: "delete",
  isActive: true,
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listDataRetentionPolicies();
    policies.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const savePolicy = async () => {
  saving.value = true;
  try {
    if (editingPolicy.value) {
      await adminAPI.updateDataRetentionPolicy(
        editingPolicy.value.id,
        form.value
      );
    } else {
      await adminAPI.createDataRetentionPolicy(form.value);
    }
    closeModal();
    await load();
  } finally {
    saving.value = false;
  }
};

const editPolicy = (policy) => {
  editingPolicy.value = policy;
  form.value = { ...policy };
  showCreate.value = true;
};

const deletePolicy = async (id) => {
  const confirmed = window.confirm("Delete this retention policy?");
  if (!confirmed) return;
  await adminAPI.deleteDataRetentionPolicy(id);
  await load();
};

const executeAll = async () => {
  const confirmed = window.confirm(
    "Run retention cleanup for all active policies?"
  );
  if (!confirmed) return;
  executing.value = true;
  try {
    const res = await adminAPI.executeDataRetention();
    alert(`Cleanup complete: ${JSON.stringify(res.data?.results, null, 2)}`);
    await load();
  } finally {
    executing.value = false;
  }
};

const closeModal = () => {
  showCreate.value = false;
  editingPolicy.value = null;
  form.value = {
    name: "",
    dataCategory: "platform_audit_logs",
    retentionDays: 90,
    action: "delete",
    isActive: true,
  };
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.data-retention-view {
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
.header-actions {
  display: flex;
  gap: var(--space-3);
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
