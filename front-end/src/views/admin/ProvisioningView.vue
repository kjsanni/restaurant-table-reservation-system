<template>
  <div class="provisioning-view">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">
        ← Back to Tenants
      </button>
      <h1>Provisioning: {{ tenantName }}</h1>
      <p class="subtitle">Monitor and manage tenant provisioning pipeline</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadStatus">Retry</button>
    </div>

    <div v-else-if="status" class="provisioning-content">
      <div class="status-cards">
        <div class="status-card">
          <span class="status-label">Status</span>
          <span class="status-value" :class="`status-${status.status}`">
            {{ formatStatus(status.status) }}
          </span>
        </div>
        <div class="status-card" v-if="status.startedAt">
          <span class="status-label">Started</span>
          <span class="status-value">{{ formatDate(status.startedAt) }}</span>
        </div>
        <div class="status-card" v-if="status.completedAt">
          <span class="status-label">Completed</span>
          <span class="status-value">{{ formatDate(status.completedAt) }}</span>
        </div>
        <div class="status-card" v-if="status.error">
          <span class="status-label">Error</span>
          <span class="status-value error-text">{{ status.error }}</span>
        </div>
      </div>

      <div class="actions-bar">
        <button
          v-if="status.status === 'idle' || status.status === 'failed'"
          class="btn-primary"
          :disabled="acting"
          @click="startProvisioning"
        >
          {{ acting ? "Starting..." : "Start Provisioning" }}
        </button>
        <button
          v-if="status.status === 'running'"
          class="btn-secondary"
          :disabled="acting"
          @click="pauseProvisioning"
        >
          {{ acting ? "Pausing..." : "Pause" }}
        </button>
        <button
          v-if="status.status === 'paused'"
          class="btn-primary"
          :disabled="acting"
          @click="resumeProvisioning"
        >
          {{ acting ? "Resuming..." : "Resume" }}
        </button>
        <button
          v-if="status.status === 'running' || status.status === 'paused'"
          class="btn-danger"
          :disabled="acting"
          @click="rollbackProvisioning"
        >
          {{ acting ? "Rolling back..." : "Rollback" }}
        </button>
        <button class="btn-ghost btn-sm" @click="loadStatus">Refresh</button>
      </div>

      <div class="steps-section">
        <h2>Pipeline Steps</h2>
        <div class="steps-list">
          <div
            v-for="(step, index) in status.steps"
            :key="step.key"
            class="step-item"
            :class="{
              active:
                index === status.currentStepIndex &&
                status.status === 'running',
              completed: step.status === 'completed',
              failed: step.status === 'failed',
              rolled_back: step.status === 'rolled_back',
            }"
          >
            <div class="step-indicator">
              <span v-if="step.status === 'completed'" class="step-icon success"
                >✓</span
              >
              <span v-else-if="step.status === 'failed'" class="step-icon error"
                >✗</span
              >
              <span
                v-else-if="step.status === 'rolled_back'"
                class="step-icon warning"
                >↩</span
              >
              <span
                v-else-if="
                  index === status.currentStepIndex &&
                  status.status === 'running'
                "
                class="step-icon active"
                >⟳</span
              >
              <span v-else class="step-icon pending">○</span>
            </div>
            <div class="step-content">
              <div class="step-title">{{ step.label || step.key }}</div>
              <div v-if="step.error" class="step-error">{{ step.error }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dlq-section" v-if="dlqEntries.length > 0">
        <h2>Dead Letter Queue</h2>
        <p class="dlq-hint">Failed provisioning jobs that can be retried.</p>
        <div class="dlq-table-wrapper">
          <table class="dlq-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Step</th>
                <th>Error</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in dlqEntries" :key="entry.jobId">
                <td>{{ entry.jobId }}</td>
                <td>{{ entry.stepKey || "unknown" }}</td>
                <td class="error-text">
                  {{ entry.error || entry.reason || "Unknown error" }}
                </td>
                <td>
                  <button
                    class="btn-ghost btn-sm"
                    :disabled="retrying === entry.jobId"
                    @click="retryEntry(entry.jobId)"
                  >
                    {{ retrying === entry.jobId ? "Retrying..." : "Retry" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No provisioning pipeline found for this tenant.</p>
      <button class="btn-primary" @click="startProvisioning" :disabled="acting">
        {{ acting ? "Starting..." : "Start Provisioning" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const router = useRouter();
const route = useRoute();
const tenantId = route.params.id;

const loading = ref(true);
const acting = ref(false);
const error = ref(null);
const status = ref(null);
const dlqEntries = ref([]);
const retrying = ref(null);

const formatStatus = (s) => {
  if (!s) return "Unknown";
  const map = {
    idle: "Idle",
    running: "Running",
    paused: "Paused",
    completed: "Completed",
    failed: "Failed",
    rolled_back: "Rolled Back",
  };
  return map[s] || s;
};

const loadStatus = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await tenantAdminAPI.getProvisioningStatus(tenantId);
    status.value = res.data?.item || null;

    try {
      const dlqRes = await tenantAdminAPI.getDLQStatus(tenantId, 50);
      dlqEntries.value = dlqRes.data?.items || [];
    } catch {
      dlqEntries.value = [];
    }
  } catch (e) {
    error.value = "Failed to load provisioning status.";
  } finally {
    loading.value = false;
  }
};

const startProvisioning = async () => {
  acting.value = true;
  try {
    await tenantAdminAPI.startProvisioning(tenantId);
    await loadStatus();
  } catch (e) {
    error.value = "Failed to start provisioning.";
  } finally {
    acting.value = false;
  }
};

const pauseProvisioning = async () => {
  acting.value = true;
  try {
    await tenantAdminAPI.pauseProvisioning(tenantId);
    await loadStatus();
  } catch (e) {
    error.value = "Failed to pause provisioning.";
  } finally {
    acting.value = false;
  }
};

const resumeProvisioning = async () => {
  acting.value = true;
  try {
    await tenantAdminAPI.resumeProvisioning(tenantId);
    await loadStatus();
  } catch (e) {
    error.value = "Failed to resume provisioning.";
  } finally {
    acting.value = false;
  }
};

const rollbackProvisioning = async () => {
  if (!confirm("Rollback provisioning? This will undo completed steps."))
    return;
  acting.value = true;
  try {
    await tenantAdminAPI.rollbackProvisioning(tenantId);
    await loadStatus();
  } catch (e) {
    error.value = "Failed to rollback provisioning.";
  } finally {
    acting.value = false;
  }
};

const retryEntry = async (jobId) => {
  retrying.value = jobId;
  try {
    await tenantAdminAPI.retryDLQEntry(tenantId, jobId);
    await loadStatus();
  } catch (e) {
    error.value = "Failed to retry DLQ entry.";
  } finally {
    retrying.value = null;
  }
};

const goBack = () => {
  router.push("/admin/tenants");
};

onMounted(() => {
  loadStatus();
});
</script>

<style scoped>
.provisioning-view {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header button {
  margin-bottom: var(--space-2);
}

.page-header h1 {
  margin: 0 0 var(--space-1);
}

.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8);
}

.error-state {
  text-align: center;
  padding: var(--space-8);
}

.error-state p {
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.status-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.status-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.status-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  text-transform: capitalize;
}

.status-value.error-text {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  font-weight: normal;
}

.status-running {
  color: var(--color-primary);
}

.status-completed {
  color: var(--color-success);
}

.status-failed {
  color: var(--color-danger);
}

.status-paused {
  color: var(--color-warning);
}

.actions-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.steps-section,
.dlq-section {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.steps-section h2,
.dlq-section h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-lg);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt, #f8fafc);
}

.step-item.active {
  background: var(--color-primary-light, #e3f2fd);
}

.step-item.completed {
  background: var(--color-success-light, #e6f4ea);
}

.step-item.failed {
  background: var(--color-danger-light, #fce8e8);
}

.step-item.rolled_back {
  background: var(--color-warning-light, #fff8e1);
}

.step-indicator {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
}

.step-icon.success {
  color: var(--color-success);
}

.step-icon.error {
  color: var(--color-danger);
}

.step-icon.warning {
  color: var(--color-warning);
}

.step-icon.active {
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

.step-icon.pending {
  color: var(--color-text-muted);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.step-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin-top: var(--space-1);
}

.dlq-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4);
}

.dlq-table-wrapper {
  overflow-x: auto;
}

.dlq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.dlq-table th,
.dlq-table td {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: var(--border-default);
}

.dlq-table th {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.dlq-table td.error-text {
  color: var(--color-danger);
}
</style>
