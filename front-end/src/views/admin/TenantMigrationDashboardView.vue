<template>
  <div class="tenant-migration-view">
    <div class="page-header">
      <div>
        <h1>Tenant Migrations</h1>
        <p class="subtitle">
          Manage schema migrations for {{ tenant?.name || "this tenant" }}
        </p>
      </div>
      <button class="btn-primary" @click="showEnqueueForm = true">
        Enqueue Migration
      </button>
    </div>

    <div v-if="showEnqueueForm" class="card enqueue-card">
      <h3>Enqueue Migration</h3>
      <div class="form-row">
        <input
          v-model="enqueueForm.migrationName"
          placeholder="Migration name (e.g. 20260813-add-field)"
          class="input"
        />
        <input
          v-model="enqueueForm.metadata"
          placeholder="Metadata (JSON, optional)"
          class="input"
        />
        <button
          class="btn-primary"
          @click="enqueueMigration"
          :disabled="enqueueing"
        >
          {{ enqueueing ? "Enqueuing..." : "Enqueue" }}
        </button>
        <button class="btn" @click="showEnqueueForm = false">Cancel</button>
      </div>
      <p v-if="enqueueError" class="error-text">{{ enqueueError }}</p>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Pending</h3>
        <div class="stat-number">{{ pending.length }}</div>
        <p class="stat-hint">Awaiting execution</p>
      </div>
      <div class="card">
        <h3>Running</h3>
        <div class="stat-number">{{ running.length }}</div>
        <p class="stat-hint">In progress</p>
      </div>
      <div class="card">
        <h3>Failed</h3>
        <div class="stat-number">{{ failed.length }}</div>
        <p class="stat-hint">Need attention</p>
      </div>
      <div class="card">
        <h3>Completed</h3>
        <div class="stat-number">{{ completedCount }}</div>
        <p class="stat-hint">Successfully applied</p>
      </div>
    </div>

    <div class="card">
      <h3>Migration Records</h3>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="records.length === 0" class="empty-state">
        No migration records yet
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Migration</th>
              <th>Status</th>
              <th>Started</th>
              <th>Completed</th>
              <th>Error</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>#{{ record.id }}</td>
              <td class="mono">{{ record.migrationName }}</td>
              <td>
                <span :class="['status-badge', record.status]">
                  {{ record.status }}
                </span>
              </td>
              <td>{{ formatDate(record.startedAt) }}</td>
              <td>{{ formatDate(record.completedAt) }}</td>
              <td class="error-cell">
                {{ record.error || "—" }}
              </td>
              <td class="actions-cell">
                <button
                  v-if="
                    record.status === 'pending' || record.status === 'failed'
                  "
                  class="btn-small primary"
                  @click="runMigration(record)"
                  :disabled="runningId === record.id"
                >
                  {{ runningId === record.id ? "Running..." : "Run" }}
                </button>
                <button
                  v-if="record.status === 'running'"
                  class="btn-small"
                  @click="pauseMigration(record.id)"
                  :disabled="pausingId === record.id"
                >
                  {{ pausingId === record.id ? "Pausing..." : "Pause" }}
                </button>
                <button
                  v-if="record.status === 'paused'"
                  class="btn-small primary"
                  @click="resumeMigration(record)"
                  :disabled="resumingId === record.id"
                >
                  {{ resumingId === record.id ? "Resuming..." : "Resume" }}
                </button>
                <button
                  v-if="
                    record.status === 'completed' || record.status === 'failed'
                  "
                  class="btn-small danger"
                  @click="rollbackMigration(record.id)"
                  :disabled="rollingBackId === record.id"
                >
                  {{
                    rollingBackId === record.id ? "Rolling back..." : "Rollback"
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import adminAPI from "@/services/adminAPI";

const route = useRoute();
const tenantId = computed(() => parseInt(route.params.id, 10));

const tenant = ref({ name: "" });
const loading = ref(false);
const records = ref([]);
const pending = ref([]);
const running = ref([]);
const failed = ref([]);
const completedCount = ref(0);

const runningId = ref(null);
const pausingId = ref(null);
const resumingId = ref(null);
const rollingBackId = ref(null);
const enqueueing = ref(false);

const showEnqueueForm = ref(false);
const enqueueForm = ref({ migrationName: "", metadata: "" });
const enqueueError = ref("");

const statusMap = computed(() => {
  const map = {};
  for (const r of records.value) {
    map[r.id] = r;
  }
  return map;
});

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const statusClass = (status) => `t-${status}`;

const load = async () => {
  loading.value = true;
  try {
    const [listRes, statusRes, tenantRes] = await Promise.all([
      adminAPI.listTenantMigrations(tenantId.value),
      adminAPI.getTenantMigrationStatus(tenantId.value),
      adminAPI.getTenant(tenantId.value),
    ]);

    records.value = listRes.data?.collection || [];
    pending.value = statusRes.data?.pending || [];
    running.value = statusRes.data?.running || [];
    failed.value = statusRes.data?.failed || [];
    completedCount.value =
      statusRes.data?.progress?.find((p) => p.status === "completed")?.count ||
      0;

    if (tenantRes.data?.item) {
      tenant.value = tenantRes.data.item;
    }
  } catch (err) {
    console.error("Failed to load tenant migrations", err);
  } finally {
    loading.value = false;
  }
};

const enqueueMigration = async () => {
  enqueueError.value = "";
  if (!enqueueForm.value.migrationName.trim()) {
    enqueueError.value = "Migration name is required";
    return;
  }

  let metadata = {};
  if (enqueueForm.value.metadata.trim()) {
    try {
      metadata = JSON.parse(enqueueForm.value.metadata);
    } catch {
      enqueueError.value = "Metadata must be valid JSON";
      return;
    }
  }

  enqueueing.value = true;
  try {
    await adminAPI.enqueueTenantMigration(tenantId.value, {
      migrationName: enqueueForm.value.migrationName.trim(),
      metadata,
    });
    enqueueForm.value = { migrationName: "", metadata: "" };
    showEnqueueForm.value = false;
    await load();
  } catch (err) {
    enqueueError.value =
      err?.response?.data?.message || "Failed to enqueue migration";
  } finally {
    enqueueing.value = false;
  }
};

const runMigration = async (record) => {
  runningId.value = record.id;
  try {
    await adminAPI.runTenantMigration(record.id, async () => {
      return { applied: true };
    });
    await load();
  } catch (err) {
    console.error("Failed to run migration", err);
  } finally {
    runningId.value = null;
  }
};

const pauseMigration = async (id) => {
  pausingId.value = id;
  try {
    await adminAPI.pauseTenantMigration(id);
    await load();
  } catch (err) {
    console.error("Failed to pause migration", err);
  } finally {
    pausingId.value = null;
  }
};

const resumeMigration = async (record) => {
  resumingId.value = record.id;
  try {
    await adminAPI.resumeTenantMigration(record.id, async () => {
      return { applied: true };
    });
    await load();
  } catch (err) {
    console.error("Failed to resume migration", err);
  } finally {
    resumingId.value = null;
  }
};

const rollbackMigration = async (id) => {
  if (!confirm("Rollback this migration? This action cannot be undone."))
    return;
  rollingBackId.value = id;
  try {
    await adminAPI.rollbackTenantMigration(id, null);
    await load();
  } catch (err) {
    console.error("Failed to rollback migration", err);
  } finally {
    rollingBackId.value = null;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.tenant-migration-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.subtitle {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(26, 20, 16, 0.04);
}

.card h3 {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
}

.stat-number {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 700;
  color: var(--neutral-900);
}

.stat-hint {
  font-size: 12px;
  color: var(--neutral-600);
  margin: 4px 0 0;
}

.enqueue-card {
  margin-bottom: 24px;
}

.enqueue-card h3 {
  margin: 0 0 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-row .input {
  flex: 1;
}

.loading-state-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--neutral-200);
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
  color: var(--ink-secondary);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--neutral-200);
  color: var(--neutral-600);
  font-weight: 600;
  white-space: nowrap;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid var(--neutral-100);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.error-cell {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--rose-600);
  font-size: 12px;
}

.actions-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover {
  background: var(--neutral-100);
}

.btn-primary {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-600);
  background: var(--accent-600);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-700);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-small {
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-small:hover {
  background: var(--neutral-100);
}

.btn-small.primary {
  background: var(--accent-600);
  color: white;
  border-color: var(--accent-600);
}

.btn-small.primary:hover {
  background: var(--accent-700);
}

.btn-small.danger {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.btn-small.danger:hover {
  background: #fecaca;
}

.input {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  font-size: 13px;
  background: var(--white);
  color: var(--neutral-900);
}

.input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
}

.error-text {
  color: var(--rose-600);
  font-size: 13px;
  margin-top: 8px;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: var(--sky-100);
  color: var(--sky-600);
}

.status-badge.running {
  background: var(--accent-100);
  color: var(--accent-600);
}

.status-badge.completed {
  background: var(--earth-100);
  color: var(--earth-600);
}

.status-badge.failed {
  background: var(--rose-100);
  color: var(--rose-600);
}

.status-badge.paused {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.status-badge.rolled_back {
  background: var(--neutral-100);
  color: var(--neutral-500);
}

@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
