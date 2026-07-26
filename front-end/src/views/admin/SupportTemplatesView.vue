<template>
  <div class="support-templates-view">
    <div class="page-header">
      <div>
        <h1>Support Templates</h1>
        <p class="subtitle">Manage quick-reply templates for support agents</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        New Template
      </button>
    </div>

    <div class="filters">
      <select v-model="filterCategory" class="filter-select" @change="load">
        <option value="">All Categories</option>
        <option value="general">General</option>
        <option value="billing">Billing</option>
        <option value="technical">Technical</option>
        <option value="onboarding">Onboarding</option>
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
              <th>Title</th>
              <th>Category</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in items" :key="template.id">
              <td>#{{ template.id }}</td>
              <td>{{ template.title }}</td>
              <td>
                <span class="badge" :class="categoryClass(template.category)">
                  {{ template.category }}
                </span>
              </td>
              <td class="preview-cell">{{ preview(template.body) }}</td>
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
            <label>Title</label>
            <input v-model="form.title" class="field-input" />
          </div>
          <div class="field">
            <label>Category</label>
            <select v-model="form.category" class="field-input">
              <option value="general">General</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="onboarding">Onboarding</option>
            </select>
          </div>
          <div class="field">
            <label>Body</label>
            <textarea
              v-model="form.body"
              rows="6"
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
const showCreate = ref(false);
const saving = ref(false);
const filterCategory = ref("");
const searchQuery = ref("");
const form = ref({ title: "", body: "", category: "general" });

const categoryClass = (category) => {
  const map = {
    general: "badge-info",
    billing: "badge-success",
    technical: "badge-warn",
    onboarding: "badge-neutral",
  };
  return map[category] || "badge-neutral";
};

const preview = (body) => {
  if (!body) return "—";
  return body.length > 120 ? body.slice(0, 120) + "…" : body;
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listSupportTemplates();
    let data = res.data?.collection || [];
    if (filterCategory.value) {
      data = data.filter((t) => t.category === filterCategory.value);
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
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
    title: template.title,
    body: template.body,
    category: template.category || "general",
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedTemplate.value?.id) {
      await adminAPI.updateSupportTemplate(
        selectedTemplate.value.id,
        form.value
      );
    } else {
      await adminAPI.createSupportTemplate(form.value);
    }
    selectedTemplate.value = null;
    form.value = { title: "", body: "", category: "general" };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeTemplate = async (id) => {
  if (!confirm("Delete this template?")) return;
  await adminAPI.deleteSupportTemplate(id);
  await load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.support-templates-view {
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
.badge-warn {
  background: var(--amber-100);
  color: var(--amber-700);
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
