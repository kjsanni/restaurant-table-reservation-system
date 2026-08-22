<template>
  <div class="platform-reports-view">
    <div class="page-header">
      <div>
        <h1>Platform Reports</h1>
        <p class="subtitle">
          Schedule and export platform-wide PDF/CSV reports
        </p>
      </div>
      <button class="btn-primary" @click="showCreate = true">New Report</button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No platform reports found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Format</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in items" :key="report.id">
              <td>#{{ report.id }}</td>
              <td>{{ report.name }}</td>
              <td>{{ report.reportType }}</td>
              <td>
                <span class="badge" :class="formatClass(report.format)">
                  {{ report.format.toUpperCase() }}
                </span>
              </td>
              <td>{{ report.status }}</td>
              <td>{{ formatDate(report.createdAt) }}</td>
              <td class="actions-cell">
                <button
                  v-if="report.status === 'completed'"
                  class="btn-sm"
                  @click="downloadReport(report.id)"
                >
                  Download
                </button>
                <button v-else class="btn-sm" disabled title="Not ready">
                  Pending
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeReport(report.id)"
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
      v-if="selectedReport"
      class="modal-overlay"
      @click.self="selectedReport = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedReport.id ? "Edit Report" : "New Report" }}</h3>
          <button class="btn-close" @click="selectedReport = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Report Type</label>
            <select v-model="form.reportType" class="field-input">
              <option value="tenants">Tenants</option>
              <option value="revenue">Revenue</option>
              <option value="reservations">Reservations</option>
              <option value="orders">Orders</option>
              <option value="payments">Payments</option>
              <option value="support">Support</option>
              <option value="usage">Usage</option>
            </select>
          </div>
          <div class="field">
            <label>Format</label>
            <select v-model="form.format" class="field-input">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div class="field">
            <label>From Date</label>
            <input v-model="form.from" type="date" class="field-input" />
          </div>
          <div class="field">
            <label>To Date</label>
            <input v-model="form.to" type="date" class="field-input" />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedReport = null">
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
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const items = ref([]);
const selectedReport = ref(null);
const showCreate = ref(false);
const saving = ref(false);
const form = ref({
  name: "",
  reportType: "tenants",
  format: "csv",
  from: "",
  to: "",
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listPlatformReports();
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const editReport = (report) => {
  selectedReport.value = report;
  const filters = report.filters || {};
  form.value = {
    name: report.name,
    reportType: report.reportType,
    format: report.format,
    from: filters.from || "",
    to: filters.to || "",
  };
  showCreate.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    const filters = {};
    if (form.value.from) filters.from = form.value.from;
    if (form.value.to) filters.to = form.value.to;

    const payload = {
      name: form.value.name,
      reportType: form.value.reportType,
      format: form.value.format,
      filters,
    };

    if (selectedReport.value?.id) {
      await adminAPI.createPlatformReport(payload);
    } else {
      await adminAPI.createPlatformReport(payload);
    }
    selectedReport.value = null;
    showCreate.value = false;
    form.value = {
      name: "",
      reportType: "tenants",
      format: "csv",
      from: "",
      to: "",
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const downloadReport = async (id) => {
  const response = await adminAPI.downloadPlatformReport(id);
  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const disposition = response.headers["content-disposition"];
  const filenameMatch =
    disposition && disposition.match(/filename="?([^"]+)"?/);
  link.download = filenameMatch ? filenameMatch[1] : `report-${id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const removeReport = async (id) => {
  if (!confirm("Delete this report?")) return;
  await adminAPI.deletePlatformReport(id);
  await load();
};

const formatClass = (format) => {
  return format === "pdf" ? "badge-info" : "badge-success";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.platform-reports-view {
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
.btn-sm[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
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
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
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
  color: var(--earth-600);
}
.badge-info {
  color: var(--accent-600);
}
</style>
