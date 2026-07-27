<template>
  <div class="analytics-view">
    <div class="page-header">
      <div>
        <h1>Advanced Analytics</h1>
        <p class="subtitle">Venue growth, churn, and LTV/CAC metrics</p>
      </div>
      <button class="btn-primary" @click="loadAll" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh All" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Growth Summary</h3>
        <div v-if="growthLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="growth" class="growth-grid">
          <div class="growth-item">
            <span>Total Venues</span>
            <b>{{ growth.summary.total }}</b>
          </div>
          <div class="growth-item">
            <span>New (30d)</span>
            <b class="status-healthy">{{ growth.summary.newVenues }}</b>
          </div>
          <div class="growth-item">
            <span>Churned (30d)</span>
            <b class="status-failed">{{ growth.summary.churned }}</b>
          </div>
          <div class="growth-item">
            <span>Reactivated (30d)</span>
            <b class="status-warning">{{ growth.summary.reactivated }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>LTV / CAC</h3>
        <div v-if="ltvLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="ltv" class="growth-grid">
          <div class="growth-item">
            <span>Active Venues</span>
            <b>{{ ltv.summary.totalActive }}</b>
          </div>
          <div class="growth-item">
            <span>Avg LTV</span>
            <b>{{ formatMoney(ltv.summary.avgLtv) }}</b>
          </div>
          <div class="growth-item">
            <span>Total LTV</span>
            <b>{{ formatMoney(ltv.summary.totalLtv) }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Churn Analysis</h3>
      <div v-if="churnLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="churn" class="churn-section">
        <div class="churn-summary">
          <span
            >Total Churned: <b>{{ churn.totalChurned }}</b></span
          >
          <span
            >By Plan: <b>{{ churnByPlanText }}</b></span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import formatMoney from "@/utils/formatMoney";

const growth = ref(null);
const growthLoading = ref(false);
const ltv = ref(null);
const ltvLoading = ref(false);
const churn = ref(null);
const churnLoading = ref(false);
const loading = ref(false);

const churnByPlanText = computed(() => {
  if (!churn.value?.byPlan) return "—";
  return Object.entries(churn.value.byPlan)
    .map(([plan, count]) => `${plan}: ${count}`)
    .join(", ");
});

const loadGrowth = async () => {
  growthLoading.value = true;
  try {
    const res = await adminAPI.getTenantGrowth();
    growth.value = res.data || null;
  } catch {
    growth.value = null;
  } finally {
    growthLoading.value = false;
  }
};

const loadLtv = async () => {
  ltvLoading.value = true;
  try {
    const res = await adminAPI.getLtvCac();
    ltv.value = res.data || null;
  } catch {
    ltv.value = null;
  } finally {
    ltvLoading.value = false;
  }
};

const loadChurn = async () => {
  churnLoading.value = true;
  try {
    const res = await adminAPI.getChurnAnalysis();
    churn.value = res.data || null;
  } catch {
    churn.value = null;
  } finally {
    churnLoading.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadGrowth, loadLtv, loadChurn]);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.analytics-view {
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
}
.growth-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
.growth-item {
  text-align: center;
}
.growth-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.growth-item b {
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
.status-failed {
  color: var(--rose-600);
}
.churn-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.churn-summary {
  display: flex;
  gap: var(--space-6);
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.churn-summary b {
  color: var(--ink);
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
</style>
