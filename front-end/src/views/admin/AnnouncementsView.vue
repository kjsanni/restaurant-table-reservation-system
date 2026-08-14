<template>
  <div class="announcements-view">
    <div class="page-header">
      <div>
        <h1>Announcements</h1>
        <p class="subtitle">Broadcast system-wide messages to all tenants</p>
      </div>
      <button class="btn-primary" v-tap-scale @click="showCreate = true">
        New Announcement
      </button>
    </div>

    <div class="filters">
      <select v-model="filterChannel" class="filter-select" @change="load">
        <option value="">All Channels</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="push">Push</option>
        <option value="in_app">In-App</option>
        <option value="all">All</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No announcements found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Channel</th>
              <th>Priority</th>
              <th>Active</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>
                <span class="badge" :class="channelClass(item.channel)">
                  {{ item.channel }}
                </span>
              </td>
              <td>{{ item.priority }}</td>
              <td>{{ item.isActive ? "Yes" : "No" }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="editItem(item)">Edit</button>
                <button class="btn-sm btn-danger" @click="removeItem(item.id)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedItem"
      class="modal-overlay"
      @click.self="selectedItem = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>
            {{ selectedItem.id ? "Edit Announcement" : "New Announcement" }}
          </h3>
          <button class="btn-close" @click="selectedItem = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Title</label>
            <input v-model="form.title" class="field-input" />
          </div>
          <div class="field">
            <label>Message</label>
            <textarea
              v-model="form.message"
              rows="5"
              class="field-input"
            ></textarea>
          </div>
          <div class="field">
            <label>Channel</label>
            <select v-model="form.channel" class="field-input">
              <option value="all">All</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
              <option value="in_app">In-App</option>
            </select>
          </div>
          <div class="field">
            <label>Priority</label>
            <select v-model="form.priority" class="field-input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.isActive" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedItem = null">
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
const selectedItem = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const filterChannel = ref("");
const form = ref({
  title: "",
  message: "",
  channel: "all",
  priority: "medium",
  isActive: true,
});

const channelClass = (channel) => {
  const map = {
    email: "badge-info",
    sms: "badge-success",
    push: "badge-warn",
    in_app: "badge-neutral",
    all: "badge-neutral",
  };
  return map[channel] || "badge-neutral";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listAnnouncements(
      filterChannel.value || undefined
    );
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editItem = (item) => {
  selectedItem.value = item;
  form.value = {
    title: item.title,
    message: item.message,
    channel: item.channel,
    priority: item.priority,
    isActive: item.isActive ?? true,
  };
};

const save = async () => {
  saving.value = true;
  try {
    if (selectedItem.value?.id) {
      await adminAPI.updateAnnouncement(selectedItem.value.id, form.value);
    } else {
      await adminAPI.createAnnouncement(form.value);
    }
    selectedItem.value = null;
    form.value = {
      title: "",
      message: "",
      channel: "all",
      priority: "medium",
      isActive: true,
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeItem = async (id) => {
  if (!confirm("Delete this announcement?")) return;
  await adminAPI.deleteAnnouncement(id);
  await load();
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
.announcements-view {
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
