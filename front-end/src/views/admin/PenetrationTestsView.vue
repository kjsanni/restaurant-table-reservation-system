<template>
  <div class="penetration-tests-view">
    <div class="page-header">
      <div>
        <h1>Penetration Tests</h1>
        <p class="subtitle">Security assessment reports and findings</p>
      </div>
      <button class="btn-primary" @click="openCreate" :disabled="creating">
        {{ creating ? "Creating..." : "New Report" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="reports.length === 0" class="empty-state">
        No penetration test reports
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tester</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id">
              <td>{{ report.title }}</td>
              <td>{{ report.tester || "—" }}</td>
              <td>{{ formatDate(report.reportDate) }}</td>
              <td>
                <span class="badge" :class="statusClass(report.status)">
                  {{ report.status }}
                </span>
              </td>
              <td>
                <button
                  class="btn-xs"
                  @click="editReport(report)"
                  :disabled="updatingId === report.id"
                >
                  Edit
                </button>
                <button
                  class="btn-xs btn-danger"
                  @click="remove(report)"
                  :disabled="deletingId === report.id"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <h3>
          {{ editingReport ? "Edit Report" : "New Penetration Test Report" }}
        </h3>
        <div class="form-grid">
          <label>
            <span>Title</span>
            <input v-model="form.title" type="text" class="input" />
          </label>
          <label>
            <span>Tester</span>
            <input v-model="form.tester" type="text" class="input" />
          </label>
          <label>
            <span>Report Date</span>
            <input v-model="form.reportDate" type="date" class="input" />
          </label>
          <label>
            <span>Status</span>
            <select v-model="form.status" class="input">
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            <span>Findings</span>
            <textarea v-model="form.findings" rows="4" class="input"></textarea>
          </label>
          <label>
            <span>Remediation</span>
            <textarea
              v-model="form.remediation"
              rows="4"
              class="input"
            ></textarea>
          </label>
          <label>
            <span>File Path</span>
            <input
              v-model="form.filePath"
              type="text"
              class="input"
              placeholder="/path/to/report.pdf"
            />
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeForm">Cancel</button>
          <button class="btn-primary" @click="save" :disabled="saving">
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
const creating = ref(false);
const saving = ref(false);
const updatingId = ref(null);
const deletingId = ref(null);
const reports = ref([]);
const showForm = ref(false);
const editingReport = ref(null);
const form = ref({
  title: "",
  tester: "",
  reportDate: "",
  status: "draft",
  findings: "",
  remediation: "",
  filePath: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listPenetrationTestReports();
    reports.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingReport.value = null;
  form.value = {
    title: "",
    tester: "",
    reportDate: "",
    status: "draft",
    findings: "",
    remediation: "",
    filePath: "",
  };
  showForm.value = true;
};

const editReport = (report) => {
  editingReport.value = report;
  form.value = {
    title: report.title,
    tester: report.tester || "",
    reportDate: report.reportDate
      ? new Date(report.reportDate).toISOString().slice(0, 10)
      : "",
    status: report.status,
    findings: report.findings || "",
    remediation: report.remediation || "",
    filePath: report.filePath || "",
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingReport.value = null;
};

const save = async () => {
  saving.value = true;
  try {
    if (editingReport.value) {
      await adminAPI.updatePenetrationTestReport(
        editingReport.value.id,
        form.value
      );
    } else {
      await adminAPI.createPenetrationTestReport(form.value);
    }
    await load();
    closeForm();
  } finally {
    saving.value = false;
  }
};

const remove = async (report) => {
  if (!window.confirm(`Delete "${report.title}"?`)) return;
  deletingId.value = report.id;
  try {
    await adminAPI.deletePenetrationTestReport(report.id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const statusClass = (status) => {
  const map = {
    draft: "status-warning",
    submitted: "status-warning",
    reviewed: "status-healthy",
    archived: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.penetration-tests-view {
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
.status-failed {
  color: var(--rose-600);
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
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
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
.btn-xs:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 640px;
  box-shadow: var(--shadow-lg);
}
.modal h3 {
  margin: 0 0 var(--space-4) 0;
}
.form-grid {
  display: grid;
  gap: var(--space-4);
}
.form-grid label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.form-grid label span {
  font-weight: 600;
  color: var(--ink);
}
.input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-sm);
}
.modal-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-5);
}
</style>
