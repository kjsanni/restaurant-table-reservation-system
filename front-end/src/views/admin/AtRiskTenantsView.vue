<template>
  <div class="at-risk-view">
    <div class="page-header">
      <div>
        <h1>At-Risk Tenants</h1>
        <p class="subtitle">
          Failed payments, brute-force attacks, and subscription health issues
        </p>
      </div>
      <button class="btn-primary" @click="loadAll" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh All" }}
      </button>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Failed Payments</div>
        <div class="card-value danger">{{ paymentAlerts.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">Brute-Force Sources</div>
        <div class="card-value warning">{{ bruteForceData.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">At-Risk Tenants</div>
        <div class="card-value">{{ atRiskTenants.length }}</div>
      </div>
      <div class="card">
        <div class="card-label">Total Past Due</div>
        <div class="card-value">
          {{ subscriptionHealth?.summary?.pastDue || 0 }}
        </div>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>Failed Payment Alerts</h3>
        <div v-if="paymentLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="paymentAlerts.length === 0" class="empty-state">
          No failed payment alerts
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Retries</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alert in paymentAlerts" :key="alert.id">
                <td>{{ alert.tenantName || alert.tenantId }}</td>
                <td>{{ formatMoney(alert.amount / 100) }}</td>
                <td>{{ alert.reason || "Unknown" }}</td>
                <td>
                  <span
                    class="badge"
                    :class="'badge-' + (alert.status || 'open')"
                  >
                    {{ alert.status }}
                  </span>
                </td>
                <td>{{ alert.retryCount || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h3>Brute-Force Aggregation</h3>
        <div v-if="bruteForceLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="bruteForceData.length === 0" class="empty-state">
          No suspicious IP/email patterns detected
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Email / IP</th>
                <th>Attempts</th>
                <th>Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in bruteForceData" :key="idx">
                <td>{{ item.email || item.ipAddress }}</td>
                <td>
                  <span class="badge" :class="attemptBadge(item.attemptCount)">
                    {{ item.attemptCount }}
                  </span>
                </td>
                <td>{{ formatDate(item.lastAttempt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Subscription Health</h3>
      <div v-if="healthLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="!subscriptionHealth" class="empty-state">
        No subscription health data available
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Period End</th>
              <th>Grace End</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in atRiskTenants" :key="tenant.id">
              <td>{{ tenant.name }}</td>
              <td>{{ tenant.status }}</td>
              <td>{{ tenant.plan }}</td>
              <td>{{ formatDate(tenant.currentPeriodEnd) }}</td>
              <td>{{ formatDate(tenant.graceEndsAt) }}</td>
              <td>
                <span class="badge" :class="riskBadge(tenant.risk)">
                  {{ tenant.risk }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, computed, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import formatMoney from "@/utils/formatMoney";

const loading = ref(false);
const paymentLoading = ref(false);
const bruteForceLoading = ref(false);
const healthLoading = ref(false);

const paymentAlerts = ref([]);
const bruteForceData = ref([]);
const subscriptionHealth = ref(null);

const atRiskTenants = computed(() => {
  if (!subscriptionHealth.value?.collection) return [];
  return subscriptionHealth.value.collection.filter(
    (t) => t.risk === "at_risk" || t.risk === "warning" || t.risk === "critical"
  );
});

const riskBadge = (risk) => {
  const map = {
    healthy: "badge-healthy",
    at_risk: "badge-configured",
    warning: "badge-configured",
    critical: "badge-unhealthy",
  };
  return map[risk] || "badge-disabled";
};

const attemptBadge = (count) => {
  if (count >= 20) return "badge-unhealthy";
  if (count >= 10) return "badge-configured";
  return "badge-disabled";
};

const loadPaymentAlerts = async () => {
  paymentLoading.value = true;
  try {
    const res = await adminAPI.listFailedPaymentAlerts({ limit: 50 });
    paymentAlerts.value = res.data?.collection || [];
  } catch {
    paymentAlerts.value = [];
  } finally {
    paymentLoading.value = false;
  }
};

const loadBruteForceAggregation = async () => {
  bruteForceLoading.value = true;
  try {
    const res = await adminAPI.getBruteForceAggregation();
    bruteForceData.value = res.data?.collection || [];
  } catch {
    bruteForceData.value = [];
  } finally {
    bruteForceLoading.value = false;
  }
};

const loadSubscriptionHealth = async () => {
  healthLoading.value = true;
  try {
    const res = await adminAPI.getSubscriptionHealth();
    subscriptionHealth.value = res.data || null;
  } catch {
    subscriptionHealth.value = null;
  } finally {
    healthLoading.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadPaymentAlerts(),
      loadBruteForceAggregation(),
      loadSubscriptionHealth(),
    ]);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.at-risk-view {
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
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
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
.card-value.danger {
  color: var(--rose-600);
}
.card-value.warning {
  color: var(--amber-600);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
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
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.badge-configured,
.badge-enabled,
.badge-healthy {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-disabled,
.badge-not_configured {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.badge-error,
.badge-unhealthy {
  background: var(--rose-100);
  color: var(--rose-700);
}
</style>
