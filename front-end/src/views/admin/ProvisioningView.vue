<template>
  <div class="provisioning-view">
    <div class="page-header">
      <div>
        <h1>Provisioning</h1>
        <p class="subtitle">
          Manage onboarding pipeline for {{ tenant?.name || "this tenant" }}
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn-primary"
          @click="startProvisioning"
          :disabled="starting"
        >
          {{ starting ? "Starting..." : "Start Provisioning" }}
        </button>
        <button
          class="btn"
          @click="pauseProvisioning"
          :disabled="!canPause || pausing"
        >
          {{ pausing ? "Pausing..." : "Pause" }}
        </button>
        <button
          class="btn-primary"
          @click="resumeProvisioning"
          :disabled="!canResume || resuming"
        >
          {{ resuming ? "Resuming..." : "Resume" }}
        </button>
        <button
          class="btn-danger"
          @click="rollbackProvisioning"
          :disabled="!canRollback || rollingBack"
        >
          {{ rollingBack ? "Rolling back..." : "Rollback" }}
        </button>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Status</h3>
        <div class="stat-number">{{ statusLabel }}</div>
        <p class="stat-hint">{{ statusHint }}</p>
      </div>
      <div class="card">
        <h3>Current Step</h3>
        <div class="stat-number">{{ currentStepLabel || "—" }}</div>
        <p class="stat-hint">
          Step {{ currentStepIndex + 1 }} of {{ steps.length }}
        </p>
      </div>
      <div class="card">
        <h3>Completed</h3>
        <div class="stat-number">{{ completedCount }}</div>
        <p class="stat-hint">Steps finished</p>
      </div>
      <div class="card">
        <h3>Failed</h3>
        <div class="stat-number">{{ failedCount }}</div>
        <p class="stat-hint">Need attention</p>
      </div>
    </div>

    <div class="card steps-card">
      <h3>Provisioning Steps</h3>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="steps.length === 0" class="empty-state">
        No steps available
      </div>
      <div v-else class="steps-list">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          :class="['step-item', step.status]"
        >
          <div class="step-indicator">
            <span class="step-number">{{ index + 1 }}</span>
            <span :class="['step-status-dot', step.status]"></span>
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.label }}</div>
            <div v-if="step.error" class="step-error">{{ step.error }}</div>
          </div>
        </div>
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
const starting = ref(false);
const pausing = ref(false);
const resuming = ref(false);
const rollingBack = ref(false);
const status = ref(null);
const steps = ref([]);

const statusLabel = computed(() => status.value?.status || "Unknown");
const currentStepIndex = computed(() => status.value?.currentStepIndex ?? -1);
const currentStepLabel = computed(() => {
  if (currentStepIndex.value >= 0 && steps.value[currentStepIndex.value]) {
    return steps.value[currentStepIndex.value].label;
  }
  return status.value?.status === "completed" ? "Done" : "—";
});
const completedCount = computed(
  () => steps.value.filter((s) => s.status === "completed").length
);
const failedCount = computed(
  () => steps.value.filter((s) => s.status === "failed").length
);
const canPause = computed(() => status.value?.status === "running");
const canResume = computed(() => status.value?.status === "paused");
const canRollback = computed(
  () =>
    status.value?.status === "completed" ||
    status.value?.status === "failed" ||
    status.value?.status === "paused"
);

const statusHint = computed(() => {
  const map = {
    running: "In progress",
    paused: "Temporarily stopped",
    completed: "All steps finished",
    failed: "Provisioning failed",
    rolled_back: "Changes reverted",
  };
  return map[status.value?.status] || "—";
});

const load = async () => {
  loading.value = true;
  try {
    const [statusRes, stepsRes, tenantRes] = await Promise.all([
      adminAPI.getTenantProvisioningStatus(tenantId.value),
      adminAPI.listProvisioningSteps(),
      adminAPI.getTenant(tenantId.value),
    ]);

    status.value = statusRes.data?.item || null;
    steps.value = (stepsRes.data?.items || []).map((s) => {
      const pipelineStep = status.value?.steps?.find((ps) => ps.key === s.key);
      return {
        ...s,
        status: pipelineStep?.status || "pending",
        error: pipelineStep?.error || null,
      };
    });

    if (tenantRes.data?.item) {
      tenant.value = tenantRes.data.item;
    }
  } catch (err) {
    console.error("Failed to load provisioning status", err);
  } finally {
    loading.value = false;
  }
};

const startProvisioning = async () => {
  starting.value = true;
  try {
    await adminAPI.startTenantProvisioning(tenantId.value);
    await load();
  } catch (err) {
    console.error("Failed to start provisioning", err);
  } finally {
    starting.value = false;
  }
};

const pauseProvisioning = async () => {
  pausing.value = true;
  try {
    await adminAPI.pauseTenantProvisioning(tenantId.value);
    await load();
  } catch (err) {
    console.error("Failed to pause provisioning", err);
  } finally {
    pausing.value = false;
  }
};

const resumeProvisioning = async () => {
  resuming.value = true;
  try {
    await adminAPI.resumeTenantProvisioning(tenantId.value);
    await load();
  } catch (err) {
    console.error("Failed to resume provisioning", err);
  } finally {
    resuming.value = false;
  }
};

const rollbackProvisioning = async () => {
  if (!confirm("Rollback provisioning? This will revert completed steps."))
    return;
  rollingBack.value = true;
  try {
    await adminAPI.rollbackTenantProvisioning(tenantId.value);
    await load();
  } catch (err) {
    console.error("Failed to rollback provisioning", err);
  } finally {
    rollingBack.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.provisioning-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
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

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.steps-card {
  margin-bottom: 24px;
}

.steps-card h3 {
  margin: 0 0 16px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  background: var(--white);
}

.step-item.pending {
  opacity: 0.75;
}

.step-item.running {
  border-color: var(--accent-500);
  background: var(--accent-50);
}

.step-item.completed {
  border-color: var(--earth-300);
  background: var(--earth-50);
}

.step-item.failed {
  border-color: var(--rose-300);
  background: var(--rose-50);
}

.step-item.paused {
  border-color: var(--neutral-300);
  background: var(--neutral-50);
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 24px;
}

.step-number {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
}

.step-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--neutral-300);
}

.step-status-dot.running {
  background: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.25);
}

.step-status-dot.completed {
  background: var(--earth-500);
}

.step-status-dot.failed {
  background: var(--rose-500);
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
}

.step-error {
  font-size: 12px;
  color: var(--rose-600);
  margin-top: 4px;
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

.btn:hover:not(:disabled) {
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

.btn-primary:hover:not(:disabled) {
  background: var(--accent-700);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-danger {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid #fecaca;
  background: #fee2e2;
  color: #991b1b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #fecaca;
}

.btn:disabled,
.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .header-actions {
    width: 100%;
  }
}
</style>
