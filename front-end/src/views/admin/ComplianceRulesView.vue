<template>
  <div class="compliance-rules-view">
    <div class="page-header">
      <div>
        <h1>Compliance Rules</h1>
        <p class="subtitle">Required compliance rules by business vertical</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">New Rule</button>
    </div>

    <div class="filters">
      <select v-model="filterVertical" class="filter-select" @change="load">
        <option value="">All Verticals</option>
        <option value="restaurant">Restaurant</option>
        <option value="salon">Salon</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No compliance rules found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vertical</th>
              <th>Rule Key</th>
              <th>Label</th>
              <th>Frequency</th>
              <th>Required</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in items" :key="rule.id">
              <td>#{{ rule.id }}</td>
              <td>
                <span class="badge" :class="verticalClass(rule.vertical)">
                  {{ rule.vertical }}
                </span>
              </td>
              <td>{{ rule.ruleKey }}</td>
              <td>{{ rule.label }}</td>
              <td>{{ rule.frequency || "—" }}</td>
              <td>{{ rule.required ? "Yes" : "No" }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="editRule(rule)">Edit</button>
                <button class="btn-sm btn-danger" @click="removeRule(rule.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedRule"
      class="modal-overlay"
      @click.self="selectedRule = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedRule.id ? "Edit Rule" : "New Rule" }}</h3>
          <button class="btn-close" @click="selectedRule = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Vertical</label>
            <select
              v-model="form.vertical"
              class="field-input"
              :disabled="!!selectedRule.id"
            >
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
            </select>
          </div>
          <div class="field">
            <label>Rule Key</label>
            <input
              v-model="form.ruleKey"
              class="field-input"
              :disabled="!!selectedRule.id"
            />
          </div>
          <div class="field">
            <label>Label</label>
            <input v-model="form.label" class="field-input" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="field-input"
            ></textarea>
          </div>
          <div class="field">
            <label>Frequency</label>
            <select v-model="form.frequency" class="field-input">
              <option value="">—</option>
              <option value="once">Once</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.required" />
              Required
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedRule = null">
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
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const items = ref([]);
const selectedRule = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const filterVertical = ref("");
const form = ref({
  vertical: "restaurant",
  ruleKey: "",
  label: "",
  description: "",
  required: true,
  frequency: "",
});

const verticalClass = (vertical) => {
  return vertical === "restaurant" ? "badge-info" : "badge-success";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listComplianceRules(
      filterVertical.value || undefined
    );
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editRule = (rule) => {
  selectedRule.value = rule;
  form.value = {
    vertical: rule.vertical,
    ruleKey: rule.ruleKey,
    label: rule.label,
    description: rule.description || "",
    required: rule.required ?? true,
    frequency: rule.frequency || "",
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedRule.value?.id) {
      await adminAPI.updateComplianceRule(selectedRule.value.id, form.value);
    } else {
      await adminAPI.createComplianceRule(form.value);
    }
    selectedRule.value = null;
    form.value = {
      vertical: "restaurant",
      ruleKey: "",
      label: "",
      description: "",
      required: true,
      frequency: "",
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeRule = async (id) => {
  if (!confirm("Delete this compliance rule?")) return;
  await adminAPI.deleteComplianceRule(id);
  await load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.compliance-rules-view {
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
.badge-success {
  background: var(--earth-100);
  color: var(--earth-700);
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
textarea.field-input {
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
