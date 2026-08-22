<template>
  <div class="delivery-failures-view">
    <div class="page-header">
      <div>
        <h1>WhatsApp Delivery Failures</h1>
        <p class="subtitle">Failure reasons, retry success, and cost impact</p>
      </div>
      <div class="filters">
        <input v-model="from" type="date" class="field-input" />
        <input v-model="to" type="date" class="field-input" />
        <button class="btn-primary" @click="load">Apply</button>
      </div>
    </div>

    <div class="card">
      <h2>Summary</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else class="summary-grid">
        <div class="summary-item">
          <label>Total Deliveries</label>
          <span>{{ summary.totalDeliveries }}</span>
        </div>
        <div class="summary-item">
          <label>Failed Deliveries</label>
          <span class="danger">{{ summary.failedCount }}</span>
        </div>
        <div class="summary-item">
          <label>Retry Success</label>
          <span
            >{{ summary.retrySuccess?.succeeded || 0 }} /
            {{ summary.retrySuccess?.attempted || 0 }}</span
          >
        </div>
        <div class="summary-item">
          <label>Retry Cost Impact</label>
          <span>{{ formatCurrency(summary.costImpact?.retryCost) }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Failure Reasons</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="reasonRows.length === 0" class="empty-state">
        No failure data
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in reasonRows" :key="row.reason">
              <td>{{ row.reason }}</td>
              <td>{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const from = ref("");
const to = ref("");
const summary = ref({});

const reasonRows = computed(() => {
  const reasons = summary.value.failureReasons || {};
  return Object.entries(reasons).map(([reason, count]) => ({ reason, count }));
});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getWhatsAppDeliveryFailures({
      from: from.value,
      to: to.value || undefined,
    });
    summary.value = res.data || {};
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GHS",
  }).format(value);
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.delivery-failures-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
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
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}

.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.card h2 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.summary-item label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
}
.summary-item span {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
}
.danger {
  color: var(--rose-600);
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
</style>
