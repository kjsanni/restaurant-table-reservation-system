<template>
  <div class="vertical-analytics-view">
    <div class="page-header">
      <div>
        <h1>Vertical Analytics</h1>
        <p class="subtitle">Restaurant vs Salon platform comparison</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Platform Summary</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="summary" class="summary-grid">
          <div class="summary-item">
            <span>Total Tenants</span>
            <b>{{ summary.totalTenants }}</b>
          </div>
          <div class="summary-item">
            <span>Total Revenue</span>
            <b>{{ formatMoney(summary.totalRevenue) }}</b>
          </div>
          <div class="summary-item">
            <span>Reservations</span>
            <b>{{ summary.totalReservations }}</b>
          </div>
          <div class="summary-item">
            <span>Customers</span>
            <b>{{ summary.totalCustomers }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div v-for="item in comparison" :key="item.vertical" class="card">
        <h3>{{ item.vertical === "restaurant" ? "Restaurant" : "Salon" }}</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else class="vertical-grid">
          <div class="vertical-item">
            <span>Tenants</span>
            <b>{{ item.totalTenants }}</b>
          </div>
          <div class="vertical-item">
            <span>Revenue</span>
            <b>{{ formatMoney(item.totalRevenue) }}</b>
          </div>
          <div class="vertical-item">
            <span>Avg Revenue</span>
            <b>{{ formatMoney(item.avgRevenue) }}</b>
          </div>
          <div class="vertical-item">
            <span>New (30d)</span>
            <b class="status-healthy">{{ item.newTenantsLast30Days }}</b>
          </div>
          <div class="vertical-item">
            <span>Reservations</span>
            <b>{{ item.totalReservations }}</b>
          </div>
          <div class="vertical-item">
            <span>Customers</span>
            <b>{{ item.totalCustomers }}</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import formatMoney from "@/utils/formatMoney";

const loading = ref(false);
const summary = ref(null);
const comparison = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getVerticalAnalytics();
    summary.value = res.data?.summary || null;
    comparison.value = res.data?.comparison || [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.vertical-analytics-view {
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
  text-transform: capitalize;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
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
.vertical-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.vertical-item {
  text-align: center;
}
.vertical-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.vertical-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
.status-healthy {
  color: var(--earth-600);
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
</style>
