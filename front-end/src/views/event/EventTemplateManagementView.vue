<template>
  <div class="event-template-management">
    <div class="page-header">
      <div>
        <h1>Event Templates</h1>
        <p class="subtitle">
          Reusable event configurations and automation presets
        </p>
      </div>
      <button class="btn-primary" @click="showCreateForm = true">
        + New Template
      </button>
    </div>

    <div v-if="showCreateForm" class="card form-card">
      <h2>Create Template</h2>
      <form @submit.prevent="createTemplate">
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select v-model="form.category">
            <option value="general">General</option>
            <option value="conference">Conference</option>
            <option value="concert">Concert</option>
            <option value="workshop">Workshop</option>
            <option value="social">Social</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="showCreateForm = false"
          >
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? "Saving..." : "Save Template" }}
          </button>
        </div>
      </form>
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
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div class="cell-primary">{{ item.name }}</div>
                <div class="cell-secondary">{{ item.description }}</div>
              </td>
              <td>{{ item.category || "General" }}</td>
              <td>{{ item.isSystem ? "System" : "Custom" }}</td>
              <td>
                <span
                  class="badge"
                  :class="item.isActive ? 'badge-success' : 'badge-danger'"
                >
                  {{ item.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-sm" @click="applyTemplate(item)">
                  Apply
                </button>
                <button
                  v-if="!item.isSystem"
                  class="btn-sm btn-danger"
                  @click="confirmDelete(item)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import eventAPI from "@/services/eventPortalAPI";

interface Template {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isSystem: boolean;
  isActive: boolean;
  config?: Record<string, any>;
}

const items = ref<Template[]>([]);
const loading = ref(true);
const saving = ref(false);
const showCreateForm = ref(false);
const form = ref({
  name: "",
  category: "general",
  description: "",
  config: {},
});

const load = async () => {
  loading.value = true;
  try {
    const res = await eventAPI.getEventTemplates();
    items.value = (res.data?.rows || res.data || []) as Template[];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const createTemplate = async () => {
  saving.value = true;
  try {
    await eventAPI.createEventTemplate(form.value);
    showCreateForm.value = false;
    form.value = { name: "", category: "general", description: "", config: {} };
    await load();
  } finally {
    saving.value = false;
  }
};

const applyTemplate = (item: Template) => {
  alert(`Template "${item.name}" applied to new event.`);
};

const confirmDelete = (item: Template) => {
  if (!confirm(`Delete template "${item.name}"?`)) return;
  eventAPI.deleteEventTemplate(item.id).then(load);
};

onMounted(load);
</script>

<style scoped>
.event-template-management {
  padding: var(--space-6);
  max-width: 1000px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
  font-size: 24px;
}
.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--neutral-500);
}
.form-card {
  margin-bottom: var(--space-6);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: var(--space-1);
  color: var(--neutral-700);
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
}
.form-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
.btn-primary {
  padding: 10px 18px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 18px;
  background: white;
  color: var(--neutral-700);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-sm {
  padding: 6px 12px;
  background: var(--primary-light);
  color: var(--primary);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}
.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 24px;
  height: 24px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--neutral-500);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--neutral-100);
}
.data-table th {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--neutral-500);
  font-weight: 600;
}
.cell-primary {
  font-weight: 600;
  color: var(--neutral-900);
}
.cell-secondary {
  font-size: 13px;
  color: var(--neutral-500);
  margin-top: 2px;
}
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}
.badge-success {
  background: #dcfce7;
  color: #166534;
}
.badge-danger {
  background: #fee2e2;
  color: #dc2626;
}
.badge-info {
  background: #dbeafe;
  color: #1e40af;
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
</style>
