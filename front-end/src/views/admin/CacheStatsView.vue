<template>
  <div class="cache-stats-view">
    <div class="page-header">
      <div>
        <h1>Cache Stats</h1>
        <p class="subtitle">Redis cache hit/miss ratio and request volume</p>
      </div>
      <button class="btn-secondary" @click="refresh" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Cache Gets</div>
        <div class="card-value">{{ stats.gets }}</div>
      </div>
      <div class="card">
        <div class="card-label">Hits</div>
        <div class="card-value success">{{ stats.hits }}</div>
      </div>
      <div class="card">
        <div class="card-label">Misses</div>
        <div class="card-value danger">{{ stats.misses }}</div>
      </div>
      <div class="card">
        <div class="card-label">Hit Rate</div>
        <div class="card-value" :class="hitRateClass">{{ stats.hitRate }}</div>
      </div>
    </div>

    <div class="card">
      <h3>Efficiency</h3>
      <div class="efficiency-bar">
        <div class="efficiency-fill" :style="{ width: stats.hitRate }"></div>
      </div>
      <p class="efficiency-note">Hit rate = hits / gets. Target: above 80%.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const stats = ref({ gets: 0, hits: 0, misses: 0, hitRate: "0.00%" });

const hitRateClass = () => {
  const rate = parseFloat(stats.value.hitRate);
  if (isNaN(rate)) return "";
  if (rate >= 80) return "success";
  if (rate >= 50) return "warn";
  return "danger";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getCacheStats();
    stats.value = res.data?.data || {
      gets: 0,
      hits: 0,
      misses: 0,
      hitRate: "0.00%",
    };
  } finally {
    loading.value = false;
  }
};

const refresh = () => load();

onMounted(() => {
  load();
});
</script>

<style scoped>
.cache-stats-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
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
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.card-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-2);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.warn {
  color: var(--amber-600);
}
.card-value.danger {
  color: var(--rose-600);
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
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.endpoint-cell {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}
.efficiency-bar {
  height: 12px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--space-3);
}
.efficiency-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-600), var(--accent));
  transition: width 0.3s ease;
}
.efficiency-note {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}
</style>
