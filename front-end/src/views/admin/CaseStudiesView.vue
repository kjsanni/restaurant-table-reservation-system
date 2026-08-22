<template>
  <div class="case-studies-view">
    <div class="page-header">
      <div>
        <h1>Case Studies</h1>
        <p class="subtitle">Venue success stories and case studies</p>
      </div>
      <button class="btn-primary" @click="openCreate">Add Case Study</button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="studies.length === 0" class="empty-state">
        No case studies
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="study in studies" :key="study.id">
              <td>{{ study.title }}</td>
              <td>{{ study.tenant?.name || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="study.isPublished ? 'badge-success' : 'badge-danger'"
                >
                  {{ study.isPublished ? "Published" : "Draft" }}
                </span>
              </td>
              <td>
                <button class="btn-sm" @click="editStudy(study)">Edit</button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeStudy(study.id)"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editing?.id ? "Edit" : "New" }} Case Study</h2>
        <form @submit.prevent="save">
          <div class="field">
            <label>Title</label>
            <input v-model="form.title" class="field-input" required />
          </div>
          <div class="field">
            <label>Content</label>
            <textarea
              v-model="form.content"
              class="field-input"
              rows="4"
            ></textarea>
          </div>
          <div class="field">
            <label>Image URL</label>
            <input v-model="form.imageUrl" class="field-input" />
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input v-model="form.isPublished" type="checkbox" />
              Published
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const studies = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ title: "", content: "", imageUrl: "", isPublished: false });

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listCaseStudies();
    studies.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.value = { title: "", content: "", imageUrl: "", isPublished: false };
  showModal.value = true;
};

const editStudy = (study) => {
  editing.value = study;
  form.value = { ...study };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editing.value = null;
};

const save = async () => {
  if (editing.value?.id) {
    await adminAPI.updateCaseStudy(editing.value.id, form.value);
  } else {
    await adminAPI.createCaseStudy(form.value);
  }
  closeModal();
  load();
};

const removeStudy = async (id) => {
  if (!confirm("Are you sure?")) return;
  await adminAPI.removeCaseStudy(id);
  load();
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.case-studies-view {
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

.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
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
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
  margin-right: var(--space-2);
}

.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}
.badge-success {
  color: var(--green-600);
}
.badge-danger {
  color: var(--rose-600);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 480px;
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  font-weight: 600;
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
