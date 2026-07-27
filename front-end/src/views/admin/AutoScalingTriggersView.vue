<template>
  <div class="auto-scaling-view">
    <div class="page-header">
      <div>
        <h1>Auto-Scaling Triggers</h1>
        <p class="subtitle">Define scaling rules based on platform metrics</p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Trigger" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="triggers.length === 0" class="empty-state">
        No auto-scaling triggers
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Metric</th>
              <th>Condition</th>
              <th>Threshold</th>
              <th>Action</th>
              <th>Min/Max</th>
              <th>Status</th>
              <th>Last Triggered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trigger in triggers" :key="trigger.id">
              <td>{{ trigger.name }}</td>
              <td>{{ trigger.metric }}</td>
              <td>{{ trigger.operator }}</td>
              <td>{{ trigger.threshold }}</td>
              <td>{{ trigger.action }}</td>
              <td>
                {{ trigger.minInstances ?? "—" }} /
                {{ trigger.maxInstances ?? "—" }}
              </td>
              <td>
                <span
                  class="badge"
                  :class="trigger.isActive ? 'status-healthy' : 'status-failed'"
                >
                  {{ trigger.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td>{{ formatDate(trigger.lastTriggeredAt) }}</td>
              <td>
                <button
                  class="btn-xs"
                  @click="editTrigger(trigger)"
                  :disabled="editingId === trigger.id"
                >
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(trigger)"
                  :disabled="deletingId === trigger.id"
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
        <h3>{{ editingItem ? "Edit Trigger" : "New Auto-Scaling Trigger" }}</h3>
        <div class="form-grid">
          <label>
            <span>Name</span>
            <input v-model="form.name" type="text" class="input" />
          </label>
          <label>
            <span>Metric</span>
            <select v-model="form.metric" class="input">
              <option value="queue_depth">Queue Depth</option>
              <option value="cpu_usage">CPU Usage</option>
              <option value="memory_usage">Memory Usage</option>
              <option value="request_rate">Request Rate</option>
              <option value="error_rate">Error Rate</option>
            </select>
          </label>
          <label>
            <span>Condition</span>
            <select v-model="form.operator" class="input">
              <option value="gt">Greater than</option>
              <option value="gte">Greater or equal</option>
              <option value="lt">Less than</option>
              <option value="lte">Less or equal</option>
              <option value="eq">Equal</option>
            </select>
          </label>
          <label>
            <span>Threshold</span>
            <input
              v-model="form.threshold"
              type="number"
              step="0.01"
              class="input"
            />
          </label>
          <label>
            <span>Action</span>
            <select v-model="form.action" class="input">
              <option value="scale_up">Scale Up</option>
              <option value="scale_down">Scale Down</option>
              <option value="alert">Alert Only</option>
            </select>
          </label>
          <label>
            <span>Min Instances</span>
            <input v-model="form.minInstances" type="number" class="input" />
          </label>
          <label>
            <span>Max Instances</span>
            <input v-model="form.maxInstances" type="number" class="input" />
          </label>
          <label>
            <span>Cooldown Minutes</span>
            <input v-model="form.cooldownMinutes" type="number" class="input" />
          </label>
          <label>
            <span>Active</span>
            <select v-model="form.isActive" class="input">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
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
const triggers = ref([]);
const showForm = ref(false);
const editingItem = ref(null);
const form = ref({
  name: "",
  metric: "queue_depth",
  operator: "gt",
  threshold: 100,
  action: "scale_up",
  minInstances: null,
  maxInstances: null,
  cooldownMinutes: 5,
  isActive: true,
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listAutoScalingTriggers();
    triggers.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingItem.value = null;
  editingId.value = null;
  form.value = {
    name: "",
    metric: "queue_depth",
    operator: "gt",
    threshold: 100,
    action: "scale_up",
    minInstances: null,
    maxInstances: null,
    cooldownMinutes: 5,
    isActive: true,
  };
  showForm.value = true;
};

const editTrigger = (trigger) => {
  editingItem.value = trigger;
  editingId.value = trigger.id;
  form.value = {
    name: trigger.name,
    metric: trigger.metric,
    operator: trigger.operator,
    threshold: trigger.threshold,
    action: trigger.action,
    minInstances: trigger.minInstances,
    maxInstances: trigger.maxInstances,
    cooldownMinutes: trigger.cooldownMinutes,
    isActive: trigger.isActive,
  };
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
      await adminAPI.updateAutoScalingTrigger(editingItem.value.id, form.value);
    } else {
      await adminAPI.createAutoScalingTrigger(form.value);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const remove = async (trigger) => {
  if (!window.confirm(`Delete auto-scaling trigger "${trigger.name}"?`)) return;
  deletingId.value = trigger.id;
  try {
    await adminAPI.deleteAutoScalingTrigger(trigger.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.auto-scaling-view {
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
