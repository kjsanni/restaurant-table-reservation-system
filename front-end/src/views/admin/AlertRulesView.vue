<template>
  <div class="alert-rules-view">
    <div class="page-header">
      <div>
        <h1>Alert Rules</h1>
        <p class="subtitle">Manage platform-wide alerting rules</p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Alert Rule" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="rules.length === 0" class="empty-state">
        No alert rules configured
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Metric</th>
              <th>Condition</th>
              <th>Threshold</th>
              <th>Channels</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td>{{ rule.name }}</td>
              <td>{{ rule.metric }}</td>
              <td>{{ rule.condition }}</td>
              <td>{{ formatThreshold(rule.threshold) }}</td>
              <td>{{ rule.channels?.join(", ") }}</td>
              <td>
                <span
                  class="badge"
                  :class="rule.isActive ? 'status-healthy' : 'status-failed'"
                >
                  {{ rule.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td>
                <button
                  class="btn-xs"
                  @click="toggle(rule)"
                  :disabled="updatingId === rule.id"
                >
                  {{ rule.isActive ? "Disable" : "Enable" }}
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(rule)"
                  :disabled="deletingId === rule.id"
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
        <h3>{{ editingRule ? "Edit Alert Rule" : "New Alert Rule" }}</h3>
        <div class="form-grid">
          <label>
            <span>Name</span>
            <input v-model="form.name" type="text" class="input" />
          </label>
          <label>
            <span>Metric</span>
            <input
              v-model="form.metric"
              type="text"
              class="input"
              placeholder="e.g. queue.depth"
            />
          </label>
          <label>
            <span>Condition</span>
            <select v-model="form.condition" class="input">
              <option value="gt">Greater than</option>
              <option value="lt">Less than</option>
              <option value="eq">Equals</option>
            </select>
          </label>
          <label>
            <span>Threshold (JSON)</span>
            <textarea
              v-model="form.thresholdText"
              class="input"
              rows="3"
              placeholder='{"value": 100}'
            ></textarea>
          </label>
          <label>
            <span>Channels (comma-separated)</span>
            <input
              v-model="form.channelsText"
              type="text"
              class="input"
              placeholder="email, webhook"
            />
          </label>
          <label>
            <span>Recipients (comma-separated)</span>
            <input
              v-model="form.recipientsText"
              type="text"
              class="input"
              placeholder="admin@example.com"
            />
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
const updatingId = ref(null);
const deletingId = ref(null);
const rules = ref([]);
const showForm = ref(false);
const editingRule = ref(null);
const form = ref({
  name: "",
  metric: "",
  condition: "gt",
  thresholdText: "{}",
  channelsText: "email",
  recipientsText: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listAlertRules();
    rules.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingRule.value = null;
  form.value = {
    name: "",
    metric: "",
    condition: "gt",
    thresholdText: "{}",
    channelsText: "email",
    recipientsText: "",
  };
  showForm.value = true;
};

const editRule = (rule) => {
  editingRule.value = rule;
  form.value = {
    name: rule.name,
    metric: rule.metric,
    condition: rule.condition,
    thresholdText: JSON.stringify(rule.threshold || {}, null, 2),
    channelsText: (rule.channels || []).join(", "),
    recipientsText: (rule.recipients || []).join(", "),
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingRule.value = null;
};

const save = async () => {
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      metric: form.value.metric,
      condition: form.value.condition,
      threshold: JSON.parse(form.value.thresholdText || "{}"),
      channels: form.value.channelsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      recipients: form.value.recipientsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: true,
    };

    if (editingRule.value) {
      await adminAPI.updateAlertRule(editingRule.value.id, payload);
    } else {
      await adminAPI.createAlertRule(payload);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const toggle = async (rule) => {
  updatingId.value = rule.id;
  try {
    await adminAPI.updateAlertRule(rule.id, { isActive: !rule.isActive });
    await load();
  } finally {
    updatingId.value = null;
  }
};

const remove = async (rule) => {
  if (!window.confirm(`Delete alert rule "${rule.name}"?`)) return;
  deletingId.value = rule.id;
  try {
    await adminAPI.deleteAlertRule(rule.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const formatThreshold = (threshold) => {
  if (!threshold || typeof threshold !== "object") return "—";
  return JSON.stringify(threshold);
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.alert-rules-view {
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
  max-width: 560px;
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
  margin-top: var(--space-5);
}
</style>
