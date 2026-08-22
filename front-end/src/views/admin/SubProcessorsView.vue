<template>
  <div class="sub-processors-view">
    <div class="page-header">
      <div>
        <h1>Sub-Processors</h1>
        <p class="subtitle">Manage third-party data processors</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        Add Sub-Processor
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No sub-processors found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Country</th>
              <th>Data Types</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="processor in items" :key="processor.id">
              <td>#{{ processor.id }}</td>
              <td>{{ processor.name }}</td>
              <td>{{ processor.category || "—" }}</td>
              <td>{{ processor.country || "—" }}</td>
              <td>
                <span v-if="processor.dataTypes" class="badge badge-info">
                  {{
                    Array.isArray(processor.dataTypes)
                      ? processor.dataTypes.join(", ")
                      : processor.dataTypes
                  }}
                </span>
                <span v-else>—</span>
              </td>
              <td>{{ processor.isActive ? "Yes" : "No" }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="editProcessor(processor)">
                  Edit
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeProcessor(processor.id)"
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
      v-if="selectedProcessor"
      class="modal-overlay"
      @click.self="selectedProcessor = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>
            {{
              selectedProcessor.id ? "Edit Sub-Processor" : "New Sub-Processor"
            }}
          </h3>
          <button class="btn-close" @click="selectedProcessor = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Category</label>
            <input v-model="form.category" class="field-input" />
          </div>
          <div class="field">
            <label>Country</label>
            <input v-model="form.country" class="field-input" />
          </div>
          <div class="field">
            <label>Data Types (comma-separated)</label>
            <input v-model="dataTypesInput" class="field-input" />
          </div>
          <div class="field">
            <label>Purpose</label>
            <textarea
              v-model="form.purpose"
              class="field-input"
              rows="3"
            ></textarea>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" v-model="form.isActive" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedProcessor = null">
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
const selectedProcessor = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const form = ref({
  name: "",
  category: "",
  country: "",
  dataTypes: null,
  purpose: "",
  isActive: true,
});
const dataTypesInput = ref("");

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listSubProcessors();
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editProcessor = (processor) => {
  selectedProcessor.value = processor;
  form.value = {
    name: processor.name,
    category: processor.category || "",
    country: processor.country || "",
    dataTypes: processor.dataTypes || null,
    purpose: processor.purpose || "",
    isActive: processor.isActive ?? true,
  };
  dataTypesInput.value = Array.isArray(processor.dataTypes)
    ? processor.dataTypes.join(", ")
    : processor.dataTypes || "";
};

const save = async () => {
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      dataTypes: dataTypesInput.value
        ? dataTypesInput.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : null,
    };

    if (selectedProcessor.value?.id) {
      await adminAPI.updateSubProcessor(selectedProcessor.value.id, payload);
    } else {
      await adminAPI.createSubProcessor(payload);
    }
    selectedProcessor.value = null;
    form.value = {
      name: "",
      category: "",
      country: "",
      dataTypes: null,
      purpose: "",
      isActive: true,
    };
    dataTypesInput.value = "";
    await load();
  } finally {
    saving.value = false;
  }
};

const removeProcessor = async (id) => {
  if (!confirm("Delete this sub-processor?")) return;
  await adminAPI.deleteSubProcessor(id);
  await load();
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
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  font-size: var(--text-sm);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
}
.modal-header h3 {
  margin: 0;
  font-size: var(--text-lg);
}
.btn-close {
  background: transparent;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--ink-muted);
}
.modal-body {
  padding: var(--space-5);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-1);
  color: var(--ink);
}
.field-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
textarea.field-input {
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
