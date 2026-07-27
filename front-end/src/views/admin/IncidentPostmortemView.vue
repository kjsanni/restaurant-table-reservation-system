<template>
  <div class="postmortem-view">
    <div class="page-header">
      <div>
        <h1>Incident Postmortems</h1>
        <p class="subtitle">Post-incident review templates and history</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        New Postmortem
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="postmortems.length === 0" class="empty-state">
        No postmortems recorded
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Summary</th>
              <th>Root Cause</th>
              <th>Author</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pm in postmortems" :key="pm.id">
              <td>#{{ pm.incident?.id }} {{ pm.incident?.title }}</td>
              <td>{{ pm.summary }}</td>
              <td>{{ pm.rootCause || "—" }}</td>
              <td>{{ pm.author?.name || pm.createdBy }}</td>
              <td>{{ formatDate(pm.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="modal-overlay"
      @click.self="showCreate = false"
    >
      <div class="modal">
        <h3>New Postmortem</h3>
        <div class="form-group">
          <label>Incident ID</label>
          <input
            v-model.number="form.incidentId"
            type="number"
            class="filter-select"
            placeholder="Incident ID"
          />
        </div>
        <div class="form-group">
          <label>Summary</label>
          <textarea
            v-model="form.summary"
            class="filter-select"
            rows="2"
            placeholder="What happened"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Root Cause</label>
          <textarea
            v-model="form.rootCause"
            class="filter-select"
            rows="2"
            placeholder="Why it happened"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Impact</label>
          <textarea
            v-model="form.impact"
            class="filter-select"
            rows="2"
            placeholder="Impact scope"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Remediation</label>
          <textarea
            v-model="form.remediation"
            class="filter-select"
            rows="2"
            placeholder="How it was fixed"
          ></textarea>
        </div>
        <div class="form-group">
          <label>Follow-up Actions</label>
          <textarea
            v-model="form.followUpActions"
            class="filter-select"
            rows="2"
            placeholder="Preventive actions"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="save"
            :disabled="saving || !form.incidentId || !form.summary"
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
const postmortems = ref([]);
const showCreate = ref(false);
const form = ref({
  incidentId: "",
  summary: "",
  rootCause: "",
  impact: "",
  remediation: "",
  followUpActions: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listPostmortems();
    postmortems.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    await adminAPI.createPostmortem(form.value);
    showCreate.value = false;
    form.value = {
      incidentId: "",
      summary: "",
      rootCause: "",
      impact: "",
      remediation: "",
      followUpActions: "",
    };
    await load();
  } finally {
    saving.value = false;
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
.postmortem-view {
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
  max-width: 560px;
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
