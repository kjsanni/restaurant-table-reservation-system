<template>
  <div class="notification-templates-view">
    <div class="page-header">
      <div>
        <h1>Notification Templates</h1>
        <p class="subtitle">
          Manage platform notification templates by channel
        </p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        New Template
      </button>
    </div>

    <div class="filters">
      <select v-model="filterChannel" class="filter-select" @change="load">
        <option value="">All Channels</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="push">Push</option>
        <option value="in_app">In-App</option>
      </select>
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
              <th>Key</th>
              <th>Channel</th>
              <th>Subject</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in items" :key="template.id">
              <td>#{{ template.id }}</td>
              <td>{{ template.key }}</td>
              <td>
                <span class="badge" :class="channelClass(template.channel)">
                  {{ template.channel }}
                </span>
              </td>
              <td>{{ template.subject || "—" }}</td>
              <td>{{ template.isActive ? "Yes" : "No" }}</td>
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
            <label>Key</label>
            <input
              v-model="form.key"
              class="field-input"
              :disabled="!!selectedTemplate.id"
            />
          </div>
          <div class="field">
            <label>Channel</label>
            <select
              v-model="form.channel"
              class="field-input"
              :disabled="!!selectedTemplate.id"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="in_app">In-App</option>
            </select>
          </div>
          <div class="field">
            <label>Subject</label>
            <input v-model="form.subject" class="field-input" />
          </div>
          <div class="field">
            <label>Body</label>
            <textarea
              v-model="form.body"
              rows="6"
              class="field-input"
            ></textarea>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.isActive" />
              Active
            </label>
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
const filterChannel = ref("");
const form = ref({
  key: "",
  channel: "email",
  subject: "",
  body: "",
  isActive: true,
});

const channelClass = (channel) => {
  const map = {
    email: "badge-info",
    sms: "badge-success",
    push: "badge-warn",
    in_app: "badge-neutral",
  };
  return map[channel] || "badge-neutral";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listNotificationTemplates(
      filterChannel.value || undefined
    );
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editTemplate = (template) => {
  selectedTemplate.value = template;
  form.value = {
    key: template.key,
    channel: template.channel,
    subject: template.subject || "",
    body: template.body,
    isActive: template.isActive ?? true,
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedTemplate.value?.id) {
      await adminAPI.updateNotificationTemplate(
        selectedTemplate.value.id,
        form.value
      );
    } else {
      await adminAPI.createNotificationTemplate(form.value);
    }
    selectedTemplate.value = null;
    form.value = {
      key: "",
      channel: "email",
      subject: "",
      body: "",
      isActive: true,
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeTemplate = async (id) => {
  if (!confirm("Delete this template?")) return;
  await adminAPI.deleteNotificationTemplate(id);
  await load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.notification-templates-view {
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
