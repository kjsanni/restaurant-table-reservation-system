<template>
  <div class="vertical-templates-view">
    <div class="page-header">
      <div>
        <h1>Vertical Templates</h1>
        <p class="subtitle">Pre-configured setups per business vertical</p>
      </div>
      <button class="btn-primary" @click="createTemplate">New Template</button>
    </div>

    <div class="filters">
      <select v-model="filterVertical" class="filter-select" @change="load">
        <option value="">All Verticals</option>
        <option value="restaurant">Restaurant</option>
        <option value="salon">Salon</option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search templates..."
        class="filter-select"
        @input="load"
      />
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No templates found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Vertical</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in items" :key="template.id">
              <td>#{{ template.id }}</td>
              <td>{{ template.name }}</td>
              <td>
                <span class="badge" :class="verticalClass(template.vertical)">
                  {{ template.vertical }}
                </span>
              </td>
              <td class="preview-cell">{{ template.description || "—" }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="editTemplate(template)">
                  Edit
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeTemplate(template.id)"
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
      v-if="selectedTemplate"
      class="modal-overlay"
      @click.self="selectedTemplate = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedTemplate.id ? "Edit Template" : "New Template" }}</h3>
          <button class="btn-close" @click="selectedTemplate = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Vertical</label>
            <select v-model="form.vertical" class="field-input">
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
            </select>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="field-input"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedTemplate = null">
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
const selectedTemplate = ref(null);
const saving = ref(false);
const filterVertical = ref("");
const searchQuery = ref("");
const form = ref({
  name: "",
  vertical: "restaurant",
  description: "",
  defaultSettings: {},
  defaultServiceModes: [],
});

const verticalClass = (vertical) => {
  return vertical === "restaurant" ? "badge-info" : "badge-success";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listVerticalTemplates();
    let data = res.data?.collection || [];
    if (filterVertical.value) {
      data = data.filter((t) => t.vertical === filterVertical.value);
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    items.value = data;
  } finally {
    loading.value = false;
  }
};

const editTemplate = (template) => {
  selectedTemplate.value = template;
  form.value = {
    name: template.name,
    vertical: template.vertical,
    description: template.description || "",
    defaultSettings: template.defaultSettings || {},
    defaultServiceModes: template.defaultServiceModes || [],
  };
};

const createTemplate = () => {
  selectedTemplate.value = {};
  form.value = {
    name: "",
    vertical: "restaurant",
    description: "",
    defaultSettings: {},
    defaultServiceModes: [],
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedTemplate.value?.id) {
      await adminAPI.updateVerticalTemplate(
        selectedTemplate.value.id,
        form.value
      );
    } else {
      await adminAPI.createVerticalTemplate(form.value);
    }
    selectedTemplate.value = null;
    form.value = {
      name: "",
      vertical: "restaurant",
      description: "",
      defaultSettings: {},
      defaultServiceModes: [],
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeTemplate = async (id) => {
  if (!confirm("Delete this template?")) return;
  await adminAPI.deleteVerticalTemplate(id);
  await load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.vertical-templates-view {
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
.preview-cell {
  max-width: 320px;
  color: var(--ink-muted);
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
.btn-danger {
  border-color: var(--rose-300);
  color: var(--rose-700);
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
</style>
