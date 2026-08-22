<template>
  <div class="finance-view">
    <div class="page-header">
      <div>
        <h1>Financial Management</h1>
        <p class="subtitle">
          Platform-wide refunds, subscription health, and anomaly detection
        </p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Subscription Health</h3>
        <div v-if="healthLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="subscriptionHealth" class="health-grid">
          <div class="health-item">
            <span>Total Venues</span>
            <b>{{ subscriptionHealth.summary.total }}</b>
          </div>
          <div class="health-item">
            <span>Healthy</span>
            <b class="status-healthy">{{
              subscriptionHealth.summary.healthy
            }}</b>
          </div>
          <div class="health-item">
            <span>At Risk</span>
            <b class="status-warning">{{
              subscriptionHealth.summary.atRisk
            }}</b>
          </div>
          <div class="health-item">
            <span>Critical</span>
            <b class="status-failed">{{
              subscriptionHealth.summary.critical
            }}</b>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Financial Anomalies</h3>
        <div v-if="anomaliesLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="anomalies.length === 0" class="empty-state">
          No anomalies detected
        </div>
        <div v-else class="anomaly-list">
          <div
            v-for="item in anomalies"
            :key="
              item.refundId ||
              item.orderId ||
              item.customerId ||
              item.giftCardId ||
              item.reservationId ||
              item.userId
            "
            class="anomaly-item"
          >
            <template v-if="item.type === 'large_refund'">
              <b>Large refund ({{ item.ratio }}x)</b>
              <span
                >Venue #{{ item.tenantId }} · GHS
                {{ (item.amount || 0).toFixed(2) }}</span
              >
            </template>
            <template v-else-if="item.type === 'high_discount'">
              <b>High discount order</b>
              <span
                >Venue #{{ item.tenantId }} · {{ item.discountValue }}% off ·
                GHS {{ (item.total || 0).toFixed(2) }}</span
              >
            </template>
            <template v-else-if="item.type === 'frequent_canceller'">
              <b>Frequent canceller</b>
              <span
                >{{ item.customerName }} ·
                {{ item.cancellationCount }} cancellations</span
              >
            </template>
            <template v-else-if="item.type === 'staff_void'">
              <b>Staff void</b>
              <span
                >Venue #{{ item.tenantId }} · {{ item.createdBy }} · GHS
                {{ (item.total || 0).toFixed(2) }}</span
              >
            </template>
            <template v-else-if="item.type === 'cash_reconciliation_gap'">
              <b>Cash reconciliation gap</b>
              <span
                >Venue #{{ item.tenantId }} · Gap: GHS
                {{ (item.gap || 0).toFixed(2) }} ({{
                  (item.ratio || 0).toFixed(2)
                }})</span
              >
            </template>
            <template v-else-if="item.type === 'inventory_shrinkage'">
              <b>Inventory shrinkage</b>
              <span
                >Venue #{{ item.tenantId }} · {{ item.name || "Item" }} · Qty:
                {{ item.quantity }} / Reorder: {{ item.reorderLevel }}</span
              >
            </template>
            <template v-else-if="item.type === 'staff_behavior_score'">
              <b>Staff behavior score: {{ item.score }}</b>
              <span
                >{{ item.username || "User" }} ({{ item.role }}) ·
                {{ item.actionCount }} actions · GHS
                {{ (item.totalAmount || 0).toFixed(2) }}</span
              >
            </template>
            <template v-else-if="item.type === 'long_table_duration'">
              <b>Long table duration</b>
              <span
                >Venue #{{ item.tenantId }} · {{ item.customerName }} ·
                {{ item.durationHours }}h · {{ item.resStatus }}</span
              >
            </template>
            <template v-else-if="item.type === 'cash_concentration'">
              <b>Cash concentration</b>
              <span
                >Venue #{{ item.tenantId }} · {{ item.cashCount }} of
                {{ item.totalPayments }} payments ({{
                  (item.cashRatio || 0).toFixed(2)
                }})</span
              >
            </template>
            <template v-else-if="item.type === 'gift_card_fraud'">
              <b>Gift card fraud</b>
              <span
                >Tenant #{{ item.tenantId }} · Purchased by
                {{ item.purchasedBy }} · Redeemed by {{ item.redeemedBy }} ·
                {{ item.hoursToRedeem }}h</span
              >
            </template>
            <template v-else-if="item.type === 'cross_tenant_fraud_pattern'">
              <b>Cross-tenant fraud pattern</b>
              <span
                >Venue #{{ item.tenantId }} ({{ item.tenantName }}) ·
                {{ item.anomalyCount }} anomalies</span
              >
            </template>
            <template v-else>
              <b>Anomaly</b>
              <span>Venue #{{ item.tenantId }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Platform Refunds</h3>
      <div class="filter-row">
        <select v-model="refundStatus" class="filter-select">
          <option value="pending" selected>Pending</option>
          <option value="succeeded">Succeeded</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
        </select>
        <button
          class="btn-primary"
          @click="loadRefunds"
          :disabled="refundsLoading"
        >
          {{ refundsLoading ? "Loading..." : "Refresh" }}
        </button>
      </div>
      <div v-if="refundsLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="refunds.length === 0" class="empty-state">
        No refunds found.
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Venue</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="refund in refunds" :key="refund.id">
            <td>{{ refund.id }}</td>
            <td>{{ refund.tenantId }}</td>
            <td>{{ formatMoney(refund.amount) }}</td>
            <td>
              <span class="badge" :class="'badge-' + refund.status">
                {{ refund.status }}
              </span>
            </td>
            <td>{{ formatDate(refund.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import formatMoney from "@/utils/formatMoney";

const subscriptionHealth = ref(null);
const healthLoading = ref(false);
const anomalies = ref([]);
const anomaliesLoading = ref(false);
const refunds = ref([]);
const refundsLoading = ref(false);
const refundStatus = ref("pending");

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

const loadAnomalies = async () => {
  anomaliesLoading.value = true;
  try {
    const res = await adminAPI.getFinancialAnomalies();
    anomalies.value = res.data?.collection || [];
  } catch {
    anomalies.value = [];
  } finally {
    anomaliesLoading.value = false;
  }
};

const loadRefunds = async () => {
  refundsLoading.value = true;
  try {
    const params = {};
    if (refundStatus.value) params.status = refundStatus.value;
    const res = await adminAPI.listPlatformRefunds(params);
    refunds.value = res.data?.collection || [];
  } catch {
    refunds.value = [];
  } finally {
    refundsLoading.value = false;
  }
};

onMounted(() => {
  loadSubscriptionHealth();
  loadAnomalies();
  loadRefunds();
});
</script>

<style scoped>
.finance-view {
  padding: var(--space-6);
}
.page-header {
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
.health-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.health-item {
  text-align: center;
}
.health-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.health-item b {
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
.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.anomaly-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.anomaly-item b {
  font-size: var(--text-sm);
  color: var(--ink);
}
.anomaly-item span {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.filter-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
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
.badge-pending {
  background: var(--accent-100);
  color: var(--accent-700);
}
.badge-succeeded {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-failed {
  background: var(--rose-100);
  color: var(--rose-700);
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
