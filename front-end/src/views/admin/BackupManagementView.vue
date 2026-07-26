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
        </div>
        <div v-else class="empty-state">No backups yet</div>
      </div>

      <div class="card">
        <h3>All Backups</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="records.length === 0" class="empty-state">
          No backup records
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Size</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in records" :key="record.id">
                <td>#{{ record.id }}</td>
                <td>{{ record.type }}</td>
                <td>
                  <span class="badge" :class="statusClass(record.status)">{{
                    record.status
                  }}</span>
                </td>
                <td>{{ formatBytes(record.sizeBytes) }}</td>
                <td>{{ formatDate(record.createdAt) }}</td>
                <td>
                  <button
                    class="btn-xs"
                    @click="download(record.id)"
                    :disabled="downloadingId === record.id"
                  >
                    DL
                  </button>
                  <button
                    class="btn-xs btn-primary"
                    @click="execute(record.id)"
                    :disabled="executingId === record.id"
                  >
                    Run
                  </button>
                  <button
                    class="btn-xs btn-danger"
                    @click="confirmRestore(record.id)"
                    :disabled="restoringId === record.id"
                  >
                    Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const creating = ref(false);
const loading = ref(false);
const latestLoading = ref(false);
const records = ref([]);
const latest = ref(null);
const downloadingId = ref(null);
const executingId = ref(null);
const restoringId = ref(null);

const load = async () => {
  loading.value = true;
  latestLoading.value = true;
  try {
    const [listRes, statusRes] = await Promise.all([
      adminAPI.listBackupRecords(),
      adminAPI.getBackupStatus(),
    ]);
    records.value = listRes.data?.collection || [];
    latest.value = statusRes.data?.latestBackup || null;
  } finally {
    loading.value = false;
    latestLoading.value = false;
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

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
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
</style>
