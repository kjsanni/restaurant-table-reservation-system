<template>
  <div class="reconciliation-view">
    <div class="page-header">
      <div>
        <h1>Multi-Currency Reconciliation</h1>
        <p class="subtitle">Payment totals by currency and venue breakdown</p>
      </div>
      <div class="filters">
        <input v-model="from" type="date" class="field-input" />
        <input v-model="to" type="date" class="field-input" />
        <button class="btn-primary" @click="load">Apply</button>
      </div>
    </div>

    <div class="card">
      <h2>Currency Totals</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="currencyRows.length === 0" class="empty-state">
        No currency data
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Payments</th>
              <th>Total Amount</th>
              <th>Total Base Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in currencyRows" :key="row.currency">
              <td>{{ row.currency }}</td>
              <td>{{ row.count }}</td>
              <td>{{ formatAmount(row.totalAmount) }}</td>
              <td>{{ formatAmount(row.totalBaseAmount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Venue Currency Breakdown</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="tenantRows.length === 0" class="empty-state">
        No venue data
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Currency</th>
              <th>Plan</th>
              <th>Payments</th>
              <th>Total Amount</th>
              <th>Total Base Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in tenantRows" :key="tenant.id">
              <td>{{ tenant.name }}</td>
              <td>{{ tenant.currency }}</td>
              <td>{{ tenant.plan }}</td>
              <td>{{ tenant.payments.reduce((s, p) => s + p.count, 0) }}</td>
              <td>
                {{
                  formatAmount(
                    tenant.payments.reduce((s, p) => s + p.totalAmount, 0)
                  )
                }}
              </td>
              <td>
                {{
                  formatAmount(
                    tenant.payments.reduce((s, p) => s + p.totalBaseAmount, 0)
                  )
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const from = ref("");
const to = ref("");
const currencyRows = ref([]);
const tenantRows = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const [currencyRes, tenantRes] = await Promise.all([
      adminAPI.getMultiCurrencyTotals({
        from: from.value,
        to: to.value || undefined,
      }),
      adminAPI.getTenantCurrencyBreakdown({
        from: from.value,
        to: to.value || undefined,
      }),
    ]);
    currencyRows.value = currencyRes.data?.collection || [];
    tenantRows.value = tenantRes.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const formatAmount = (value) => {
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
.reconciliation-view {
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
