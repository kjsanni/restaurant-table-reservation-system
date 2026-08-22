<template>
  <div class="backup-view">
    <div class="page-header">
      <div>
        <h1>Backups</h1>
        <p class="subtitle">Manage database backups and restore points</p>
      </div>
      <button class="btn-primary" @click="createBackup" :disabled="creating">
        {{ creating ? "Creating..." : "Create Backup" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Latest Backup</h3>
        <div v-if="latestLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="latest" class="latest-backup">
          <div class="backup-item">
            <span>Type</span>
            <b>{{ latest.type }}</b>
          </div>
          <div class="backup-item">
            <span>Status</span>
            <b :class="statusClass(latest.status)">{{ latest.status }}</b>
          </div>
          <div class="backup-item">
            <span>Size</span>
            <b>{{ formatBytes(latest.sizeBytes) }}</b>
          </div>
          <div class="backup-item">
            <span>Created</span>
            <b>{{ formatDate(latest.createdAt) }}</b>
          </div>
          <div class="backup-item" v-if="latest.frequency">
            <span>Frequency</span>
            <b>{{ latest.frequency }}</b>
          </div>
          <div class="backup-item" v-if="latest.nextRunAt">
            <span>Next Run</span>
            <b>{{ formatDate(latest.nextRunAt) }}</b>
          </div>
          <div class="backup-item" v-if="latest.lastRunAt">
            <span>Last Run</span>
            <b>{{ formatDate(latest.lastRunAt) }}</b>
          </div>
          <div class="backup-actions">
            <button
              class="btn-secondary"
              @click="download(latest.id)"
              :disabled="downloadingId === latest.id"
            >
              {{ downloadingId === latest.id ? "Downloading..." : "Download" }}
            </button>
            <button
              class="btn-primary"
              @click="execute(latest.id)"
              :disabled="executingId === latest.id"
            >
              {{ executingId === latest.id ? "Running..." : "Run Backup" }}
            </button>
            <button
              class="btn-danger"
              @click="confirmRestore(latest.id)"
              :disabled="restoringId === latest.id"
            >
              {{ restoringId === latest.id ? "Restoring..." : "Restore" }}
            </button>
          </div>
          <div class="schedule-form" v-if="latest">
            <h4>Schedule Backup</h4>
            <div class="form-row">
              <select v-model="scheduleForm.frequency" class="input">
                <option value="">No schedule</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="datetime-local"
                v-model="scheduleForm.nextRunAt"
                class="input"
                :disabled="!scheduleForm.frequency"
              />
              <button
                class="btn-primary"
                @click="updateSchedule(latest.id)"
                :disabled="schedulingId === latest.id"
              >
                {{ schedulingId === latest.id ? "Saving..." : "Save Schedule" }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">No backups yet</div>
      </div>

      <div class="card">
        <h3>Scheduled Backups</h3>
        <div v-if="scheduledLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="scheduled.length === 0" class="empty-state">
          No scheduled backups
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Frequency</th>
                <th>Next Run</th>
                <th>Last Run</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in scheduled" :key="record.id">
                <td>#{{ record.id }}</td>
                <td>{{ record.frequency }}</td>
                <td>{{ formatDate(record.nextRunAt) }}</td>
                <td>{{ formatDate(record.lastRunAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const creating = ref(false);
const loading = ref(false);
const latestLoading = ref(false);
const scheduledLoading = ref(false);
const records = ref([]);
const latest = ref(null);
const scheduled = ref([]);
const downloadingId = ref(null);
const executingId = ref(null);
const restoringId = ref(null);
const schedulingId = ref(null);
const scheduleForm = ref({ frequency: "", nextRunAt: "" });

const load = async () => {
  loading.value = true;
  latestLoading.value = true;
  scheduledLoading.value = true;
  try {
    const [listRes, statusRes, scheduledRes] = await Promise.all([
      adminAPI.listBackupRecords(),
      adminAPI.getBackupStatus(),
      adminAPI.getScheduledBackups(),
    ]);
    records.value = listRes.data?.collection || [];
    latest.value = statusRes.data?.latestBackup || null;
    scheduled.value = scheduledRes.data?.collection || [];
    if (latest.value && latest.value.frequency) {
      scheduleForm.value.frequency = latest.value.frequency || "";
      scheduleForm.value.nextRunAt = latest.value.nextRunAt
        ? new Date(latest.value.nextRunAt).toISOString().slice(0, 16)
        : "";
    }
  } finally {
    loading.value = false;
    latestLoading.value = false;
    scheduledLoading.value = false;
  }
};

const createBackup = async () => {
  creating.value = true;
  try {
    await adminAPI.createBackup({ type: "full" });
    await load();
  } finally {
    creating.value = false;
  }
};

const updateSchedule = async (id) => {
  schedulingId.value = id;
  try {
    const data = {
      frequency: scheduleForm.value.frequency || undefined,
      nextRunAt: scheduleForm.value.nextRunAt || undefined,
    };
    await adminAPI.scheduleBackup(id, data);
    await load();
  } finally {
    schedulingId.value = null;
  }
};

const execute = async (id) => {
  executingId.value = id;
  try {
    await adminAPI.executeBackup(id);
    await load();
  } finally {
    executingId.value = null;
  }
};

const confirmRestore = async (id) => {
  const confirmed = window.confirm(
    "Restore this backup? This will overwrite current data."
  );
  if (!confirmed) return;
  restoringId.value = id;
  try {
    await adminAPI.restoreBackup(id, false);
    await load();
  } finally {
    restoringId.value = null;
  }
};

const download = async (id) => {
  downloadingId.value = id;
  try {
    const res = await adminAPI.downloadBackup(id);
    const blob = new Blob([res.data], { type: "application/sql" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${id}.sql`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } finally {
    downloadingId.value = null;
  }
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const statusClass = (status) => {
  const map = {
    completed: "status-healthy",
    running: "status-warning",
    failed: "status-failed",
    pending: "status-warning",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.backup-view {
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
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.latest-backup {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.backup-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.backup-item b {
  color: var(--ink);
}
.backup-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
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
.schedule-form {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}
.schedule-form h4 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}
.form-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.input {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-sm);
}
.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
