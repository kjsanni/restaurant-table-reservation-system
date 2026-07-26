<template>
  <div class="sub-processors-view">
    <div class="page-header">
      <div>
        <h1>Sub-Processors</h1>
        <p class="subtitle">Third-party data processors and DPA tracking</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        Add Sub-Processor
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="processors.length === 0" class="empty-state">
        No sub-processors registered
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purpose</th>
              <th>Location</th>
              <th>Status</th>
              <th>DPA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="processor in processors" :key="processor.id">
              <td>{{ processor.name }}</td>
              <td>{{ processor.purpose }}</td>
              <td>{{ processor.location || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="
                    processor.status === 'active'
                      ? 'status-healthy'
                      : 'status-warning'
                  "
                  >{{ processor.status }}</span
                >
              </td>
              <td>
                <a
                  v-if="processor.dpaUrl"
                  :href="processor.dpaUrl"
                  target="_blank"
                  class="link"
                  >View</a
                >
                <span v-else>—</span>
              </td>
              <td>
                <button class="btn-xs" @click="editProcessor(processor)">
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="deleteProcessor(processor.id)"
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
      v-if="showCreate || editingProcessor"
      class="modal-overlay"
      @click.self="closeModal"
    >
      <div class="modal">
        <h3>
          {{ editingProcessor ? "Edit Sub-Processor" : "Add Sub-Processor" }}
        </h3>
        <div class="form-group">
          <label>Name</label>
          <input
            v-model="form.name"
            class="filter-select"
            placeholder="e.g. Paystack"
          />
        </div>
        <div class="form-group">
          <label>Purpose</label>
          <textarea
            v-model="form.purpose"
            class="filter-select"
            rows="2"
            placeholder="Data processing purpose"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Location</label>
          <input
            v-model="form.location"
            class="filter-select"
            placeholder="e.g. Ghana, EU"
          />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="form.status" class="filter-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>
        <div class="form-group">
          <label>DPA URL</label>
          <input
            v-model="form.dpaUrl"
            class="filter-select"
            placeholder="https://..."
          />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn-primary"
            @click="saveProcessor"
            :disabled="saving || !form.name"
          >
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
const saving = ref(false);
const processors = ref([]);
const showCreate = ref(false);
const editingProcessor = ref(null);
const form = ref({
  name: "",
  purpose: "",
  location: "",
  status: "active",
  dpaUrl: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listSubProcessors();
    processors.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const saveProcessor = async () => {
  saving.value = true;
  try {
    if (editingProcessor.value) {
      await adminAPI.updateSubProcessor(editingProcessor.value.id, form.value);
    } else {
      await adminAPI.createSubProcessor(form.value);
    }
    closeModal();
    await load();
  } finally {
    saving.value = false;
  }
};

const editProcessor = (processor) => {
  editingProcessor.value = processor;
  form.value = { ...processor };
  showCreate.value = true;
};

const deleteProcessor = async (id) => {
  const confirmed = window.confirm("Delete this sub-processor?");
  if (!confirmed) return;
  await adminAPI.deleteSubProcessor(id);
  await load();
};

const closeModal = () => {
  showCreate.value = false;
  editingProcessor.value = null;
  form.value = {
    name: "",
    purpose: "",
    location: "",
    status: "active",
    dpaUrl: "",
  };
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.sub-processors-view {
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
.status-warning {
  color: var(--accent-600);
}
.link {
  color: var(--brand-600);
  text-decoration: none;
  font-weight: 600;
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
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
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
textarea.filter-select {
  resize: vertical;
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
