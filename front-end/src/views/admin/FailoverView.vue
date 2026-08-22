<template>
  <div class="failover-view">
    <div class="page-header">
      <div>
        <h1>Data Center Failover</h1>
        <p class="subtitle">Region failover runbook and DNS switch controls</p>
      </div>
    </div>

    <div class="dashboard-summary">
      <div class="summary-card">
        <div class="summary-label">Primary Region</div>
        <div class="summary-value">{{ primaryRegion }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Failover Region</div>
        <div class="summary-value">{{ failoverRegion }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Status</div>
        <div class="summary-value" :class="statusClass(status)">
          {{ status }}
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Last Tested</div>
        <div class="summary-value">{{ formatDate(lastTestedAt) }}</div>
      </div>
    </div>

    <div class="card">
      <h3>Failover Runbook</h3>
      <div class="runbook">
        <ol>
          <li>Verify primary region health checks are failing.</li>
          <li>
            Confirm failover region database replication lag is within
            tolerance.
          </li>
          <li>Update DNS records to point to failover region load balancer.</li>
          <li>Promote failover Redis instance to primary.</li>
          <li>Restart application workers in failover region.</li>
          <li>Verify venue traffic is routing correctly.</li>
          <li>Update status page and notify stakeholders.</li>
        </ol>
      </div>
      <div
        class="form-grid"
        style="margin-top: var(--space-4); max-width: 480px"
      >
        <label>
          <span>Primary Region</span>
          <input v-model="primaryRegion" type="text" class="input" />
        </label>
        <label>
          <span>Failover Region</span>
          <input v-model="failoverRegion" type="text" class="input" />
        </label>
        <label>
          <span>Status</span>
          <select v-model="status" class="input">
            <option value="standby">Standby</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label>
          <span>Last Tested</span>
          <input v-model="lastTestedAt" type="date" class="input" />
        </label>
        <button class="btn-primary" @click="save" :disabled="saving">
          {{ saving ? "Saving..." : "Save Configuration" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const saving = ref(false);
const primaryRegion = ref("us-east-1");
const failoverRegion = ref("eu-west-1");
const status = ref("standby");
const lastTestedAt = ref("");

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listComplianceEvidence({
      framework: "SOC2",
      controlId: "failover",
    });
    const items = res.data?.collection || [];
    const item = items[0];
    if (item) {
      primaryRegion.value = item.owner || primaryRegion.value;
      failoverRegion.value = item.evidenceUrl || failoverRegion.value;
      status.value =
        item.status === "completed"
          ? "active"
          : item.status === "failed"
            ? "failed"
            : "standby";
      lastTestedAt.value = item.dueDate ? item.dueDate.split("T")[0] : "";
    }
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    const payload = {
      framework: "SOC2",
      controlId: "failover",
      title: "Data Center Failover Runbook",
      description: "Region failover configuration and DNS switch controls",
      status:
        status.value === "active"
          ? "completed"
          : status.value === "failed"
            ? "failed"
            : "in_progress",
      owner: primaryRegion.value,
      dueDate: lastTestedAt.value
        ? new Date(lastTestedAt.value).toISOString()
        : null,
      evidenceUrl: failoverRegion.value,
    };
    await adminAPI.createComplianceEvidence(payload);
    await load();
  } finally {
    saving.value = false;
  }
};

const statusClass = (status) => {
  const map = {
    standby: "status-warning",
    active: "status-healthy",
    failed: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.failover-view {
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
.dashboard-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.summary-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-sm);
}
.summary-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.summary-value {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
  text-transform: capitalize;
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
}
.runbook {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.runbook ol {
  margin: 0;
  padding-left: var(--space-5);
}
.runbook li {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
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

.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.status-failed {
  color: var(--rose-600);
}
</style>
