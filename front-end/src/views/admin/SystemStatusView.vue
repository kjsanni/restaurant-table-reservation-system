<template>
  <div class="status-page-view">
    <div class="page-header">
      <div>
        <h1>System Status</h1>
        <p class="subtitle">Platform health and uptime overview</p>
      </div>
      <div class="header-actions">
        <span class="badge" :class="overallStatusClass">{{
          overallStatus
        }}</span>
      </div>
    </div>

    <div class="cards-grid">
      <div v-for="check in checks" :key="check.name" class="card">
        <h3>{{ check.name }}</h3>
        <div class="status-indicator" :class="statusClass(check.status)">
          <div class="status-dot"></div>
          <span class="status-text">{{ check.status }}</span>
        </div>
        <div v-if="check.latencyMs" class="metric">
          Latency: <b>{{ check.latencyMs }}ms</b>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Environment</h3>
      <div class="env-grid">
        <div class="env-item">
          <span>Node Environment</span>
          <b>{{ envInfo.nodeEnv }}</b>
        </div>
        <div class="env-item">
          <span>Redis</span>
          <b
            :class="
              envInfo.redis === 'configured'
                ? 'status-healthy'
                : 'status-failed'
            "
            >{{ envInfo.redis }}</b
          >
        </div>
        <div class="env-item">
          <span>Platform Tenants</span>
          <b>{{ envInfo.counts?.tenants || 0 }}</b>
        </div>
        <div class="env-item">
          <span>Platform Users</span>
          <b>{{ envInfo.counts?.users || 0 }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import adminAPI from "@/services/adminAPI";

const overallStatus = ref("loading");
const checks = ref([]);
const envInfo = ref({});

const load = async () => {
  try {
    const res = await adminAPI.getPlatformDebug();
    envInfo.value = res.data || {};
    checks.value = [
      { name: "Database", status: envInfo.value.checks?.database || "unknown" },
      { name: "Redis", status: envInfo.value.checks?.redis || "unknown" },
      { name: "BullMQ", status: envInfo.value.checks?.bullmq || "unknown" },
      { name: "Memory", status: envInfo.value.checks?.memory || "unknown" },
    ];
    const statuses = checks.value.map((c) => c.status);
    if (statuses.every((s) => s === "healthy")) {
      overallStatus.value = "Operational";
    } else if (statuses.some((s) => s === "degraded" || s === "warning")) {
      overallStatus.value = "Degraded";
    } else if (statuses.some((s) => s === "unhealthy")) {
      overallStatus.value = "Outage";
    } else {
      overallStatus.value = "Unknown";
    }
  } catch {
    overallStatus.value = "Error";
  }
};

const statusClass = (status) => {
  const map = {
    healthy: "status-healthy",
    unavailable: "status-warning",
    warning: "status-warning",
    degraded: "status-warning",
    unhealthy: "status-failed",
    unknown: "status-warning",
  };
  return map[status] || "";
};

const overallStatusClass = ref("status-healthy");

watch(overallStatus, (val) => {
  const map = {
    Operational: "status-healthy",
    Degraded: "status-warning",
    Outage: "status-failed",
    Error: "status-failed",
    Unknown: "status-warning",
    loading: "status-warning",
  };
  overallStatusClass.value = map[val] || "";
});

onMounted(() => {
  load();
});
</script>

<style scoped>
.status-page-view {
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
  grid-template-columns: repeat(4, 1fr);
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
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.status-healthy .status-dot {
  background: var(--earth-500);
}
.status-warning .status-dot {
  background: var(--accent-500);
}
.status-failed .status-dot {
  background: var(--rose-500);
}
.status-text {
  font-weight: 600;
  text-transform: capitalize;
}
.metric {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
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
.env-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.env-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.env-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.env-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
</style>
