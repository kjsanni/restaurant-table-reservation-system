<template>
  <div class="migration-view">
    <div class="page-header">
      <div>
        <h1>Migration Tools</h1>
        <p class="subtitle">Database migration status and history</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="status" class="migration-summary">
        <div class="summary-item">
          <span>Total</span>
          <b>{{ status.total }}</b>
        </div>
        <div class="summary-item">
          <span>Applied</span>
          <b class="status-healthy">{{ status.applied }}</b>
        </div>
        <div class="summary-item">
          <span>Pending</span>
          <b
            :class="status.pending > 0 ? 'status-warning' : 'status-healthy'"
            >{{ status.pending }}</b
          >
        </div>
      </div>
    </div>

    <div
      v-if="status?.pendingMigrations?.length"
      class="card"
      style="margin-top: var(--space-5)"
    >
      <h3>Pending Migrations</h3>
      <div class="pending-list">
        <div
          v-for="migration in status.pendingMigrations"
          :key="migration"
          class="pending-item"
        >
          <span class="pending-name">{{ migration }}</span>
          <span class="badge status-warning">Pending</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-6)">
      <h3>Tenant Data Migration</h3>
      <p class="subtitle">Export or import tenant data between environments</p>

      <div class="migration-grid">
        <div class="migration-section">
          <h4>Export Tenant</h4>
          <label>
            <span>Tenant ID</span>
            <input
              v-model="exportTenantId"
              type="number"
              class="input"
              placeholder="e.g. 1"
            />
          </label>
          <button
            class="btn-primary"
            @click="exportTenant"
            :disabled="exporting"
          >
            {{ exporting ? "Exporting..." : "Export" }}
          </button>
          <pre v-if="exportResult" class="result-preview">{{
            exportResult
          }}</pre>
        </div>

        <div class="migration-section">
          <h4>Import Tenant</h4>
          <label>
            <span>Mode</span>
            <select v-model="importMode" class="input">
              <option value="create">Create new tenant</option>
              <option value="merge">Merge into existing tenant</option>
            </select>
          </label>
          <label>
            <span>Target Tenant ID (for merge)</span>
            <input
              v-model="importTargetId"
              type="number"
              class="input"
              placeholder="Optional for merge"
            />
          </label>
          <label>
            <span>JSON Payload</span>
            <textarea
              v-model="importPayload"
              rows="6"
              class="input"
              placeholder='{"tenant":{...},"settings":[...]}'
            ></textarea>
          </label>
          <button
            class="btn-primary"
            @click="importTenant"
            :disabled="importing"
          >
            {{ importing ? "Importing..." : "Import" }}
          </button>
          <pre v-if="importResult" class="result-preview">{{
            importResult
          }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const status = ref(null);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getMigrationStatus();
    status.value = res.data || null;
  } finally {
    loading.value = false;
  }
};

const exportTenantId = ref("");
const exporting = ref(false);
const exportResult = ref("");

const exportTenant = async () => {
  exporting.value = true;
  exportResult.value = "";
  try {
    const res = await adminAPI.exportTenantMigration(exportTenantId.value);
    exportResult.value = JSON.stringify(res.data, null, 2);
  } catch (err) {
    exportResult.value =
      "Error: " + (err.response?.data?.message || err.message);
  } finally {
    exporting.value = false;
  }
};

const importMode = ref("create");
const importTargetId = ref("");
const importPayload = ref("");
const importing = ref(false);
const importResult = ref("");

const importTenant = async () => {
  importing.value = true;
  importResult.value = "";
  try {
    let payload = importPayload.value;
    if (payload && typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        importResult.value = "Error: Invalid JSON payload";
        importing.value = false;
        return;
      }
    }
    const res = await adminAPI.importTenantMigration({
      mode: importMode.value,
      targetTenantId: importTargetId.value || undefined,
      payload,
    });
    importResult.value = JSON.stringify(res.data, null, 2);
  } catch (err) {
    importResult.value =
      "Error: " + (err.response?.data?.message || err.message);
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.migration-view {
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
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.migration-summary {
  display: flex;
  gap: var(--space-5);
}
.summary-item {
  text-align: center;
}
.summary-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.summary-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.pending-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.pending-name {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
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
.migration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-4);
}
.migration-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.migration-section h4 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--ink);
}
.migration-section label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.migration-section label span {
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
.result-preview {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-size: var(--text-xs);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow: auto;
}
</style>
