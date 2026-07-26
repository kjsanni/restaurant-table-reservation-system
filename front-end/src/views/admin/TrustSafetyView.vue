<template>
  <div class="trust-safety-view">
    <div class="page-header">
      <div>
        <h1>Trust & Safety</h1>
        <p class="subtitle">Tenant health and risk scoring</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Summary</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="summary" class="summary-grid">
          <div class="summary-item">
            <span>Total</span>
            <b>{{ summary.total }}</b>
          </div>
          <div class="summary-item">
            <span>Healthy</span>
            <b class="status-healthy">{{ summary.healthy }}</b>
          </div>
          <div class="summary-item">
            <span>At Risk</span>
            <b class="status-warning">{{ summary.atRisk }}</b>
          </div>
          <div class="summary-item">
            <span>High Risk</span>
            <b class="status-failed">{{ summary.highRisk }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Tenant Scores</h3>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="scores.length === 0" class="empty-state">
        No tenants found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Score</th>
              <th>Risk</th>
              <th>Failed Payments</th>
              <th>Open Tickets</th>
              <th>Recent Logins</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in scores" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.plan }}</td>
              <td>{{ item.status }}</td>
              <td>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    :style="{ width: item.score + '%' }"
                    :class="scoreClass(item.score)"
                  ></div>
                  <span>{{ item.score }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="riskClass(item.risk)">{{
                  item.risk
                }}</span>
              </td>
              <td>{{ item.failedPayments }}</td>
              <td>{{ item.openTickets }}</td>
              <td>{{ item.recentLogins }}</td>
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
const summary = ref(null);
const scores = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getTenantHealthScores();
    summary.value = res.data?.summary || null;
    scores.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const scoreClass = (score) => {
  if (score >= 80) return "score-good";
  if (score >= 60) return "score-warn";
  return "score-bad";
};

const riskClass = (risk) => {
  const map = {
    low: "status-healthy",
    medium: "status-warning",
    high: "status-failed",
  };
  return map[risk] || "";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.trust-safety-view {
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
.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.status-failed {
  color: var(--rose-600);
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
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.score-bar {
  position: relative;
  width: 100%;
  height: 20px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.score-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
}
.score-good {
  background: var(--earth-500);
}
.score-warn {
  background: var(--accent-500);
}
.score-bad {
  background: var(--rose-500);
}
.score-bar span {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--ink);
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
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>
