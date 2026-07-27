<template>
  <div class="conversion-view">
    <div class="page-header">
      <div>
        <h1>Shaq Express Order Conversion</h1>
        <p class="subtitle">WhatsApp order → delivery completion funnel</p>
      </div>
      <div class="filters">
        <input v-model="from" type="date" class="field-input" />
        <input v-model="to" type="date" class="field-input" />
        <button class="btn-primary" @click="load">Apply</button>
      </div>
    </div>

    <div class="card">
      <h2>Funnel</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else class="funnel-grid">
        <div class="funnel-item">
          <label>WhatsApp Orders</label>
          <span>{{ funnel.whatsappOrders }}</span>
        </div>
        <div class="funnel-item">
          <label>With Delivery</label>
          <span>{{ funnel.withDelivery }}</span>
        </div>
        <div class="funnel-item">
          <label>Delivery Completed</label>
          <span class="success">{{ funnel.deliveryCompleted }}</span>
        </div>
        <div class="funnel-item">
          <label>Delivery Failed</label>
          <span class="danger">{{ funnel.deliveryFailed }}</span>
        </div>
        <div class="funnel-item">
          <label>Completion Rate</label>
          <span>{{ completionRate }}%</span>
        </div>
        <div class="funnel-item">
          <label>Total Revenue</label>
          <span>{{ formatCurrency(funnel.totalRevenue) }}</span>
        </div>
        <div class="funnel-item">
          <label>Delivered Revenue</label>
          <span>{{ formatCurrency(funnel.deliveredRevenue) }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Regional Breakdown</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="breakdownRows.length === 0" class="empty-state">
        No delivery data
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Region</th>
              <th>Deliveries</th>
              <th>Completed</th>
              <th>Failed</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in breakdownRows" :key="row.region">
              <td>{{ row.region }}</td>
              <td>{{ row.deliveries }}</td>
              <td>{{ row.completed }}</td>
              <td>{{ row.failed }}</td>
              <td>{{ formatCurrency(row.revenue) }}</td>
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
const funnel = ref({});
const breakdown = ref([]);

const completionRate = computed(() => {
  if (!funnel.value.withDelivery) return 0;
  return Math.round(
    (funnel.value.deliveryCompleted / funnel.value.withDelivery) * 100
  );
});

const breakdownRows = computed(() => breakdown.value || []);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getShaqExpressOrderConversion({
      from,
      to: to.value || undefined,
    });
    funnel.value = res.data?.funnel || {};
    breakdown.value = res.data?.breakdown || [];
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
.conversion-view {
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
.funnel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.funnel-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.funnel-item label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
}
.funnel-item span {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
}
.success {
  color: var(--green-600);
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
