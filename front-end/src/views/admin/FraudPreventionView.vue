<template>
  <div class="fraud-view">
    <div class="page-header">
      <div>
        <h1>Fraud & Integrity</h1>
        <p class="subtitle">
          Refund anomalies, discount abuse, voids, cash gaps, inventory
          shrinkage, staff behavior, table duration, gift card fraud, and
          cross-tenant patterns
        </p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
    </div>

    <div class="filters">
      <select v-model="filter" class="filter-select" @change="load">
        <option value="">All Anomalies</option>
        <option value="large_refund">Large Refunds</option>
        <option value="high_discount">High Discounts</option>
        <option value="frequent_canceller">Frequent Cancellers</option>
        <option value="staff_void">Staff Voids</option>
        <option value="cash_reconciliation_gap">
          Cash Reconciliation Gaps
        </option>
        <option value="inventory_shrinkage">Inventory Shrinkage</option>
        <option value="staff_behavior_score">Staff Behavior Scores</option>
        <option value="long_table_duration">Long Table Duration</option>
        <option value="cash_concentration">Cash Concentration</option>
        <option value="gift_card_fraud">Gift Card Fraud</option>
        <option value="cross_tenant_fraud_pattern">
          Cross-Tenant Fraud Patterns
        </option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No anomalies detected
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Details</th>
              <th>Amount / Value</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="
                item.refundId ||
                item.orderId ||
                item.customerId ||
                item.itemId ||
                item.userId
              "
            >
              <td>
                <span class="badge" :class="typeClass(item.type)">
                  {{ item.type?.replace("_", " ") }}
                </span>
              </td>
              <td>
                <span v-if="item.type === 'large_refund'"
                  >Refund > 50% of payment</span
                >
                <span v-else-if="item.type === 'high_discount'"
                  >Discount >= {{ item.discountValue }}%</span
                >
                <span v-else-if="item.type === 'frequent_canceller'"
                  >{{ item.cancellationCount }} cancellations in 30d</span
                >
                <span v-else-if="item.type === 'staff_void'"
                  >Voided by {{ item.createdBy }} on order #{{
                    item.orderId
                  }}</span
                >
                <span v-else-if="item.type === 'cash_reconciliation_gap'"
                  >Cash gap: GHS {{ item.gap?.toFixed(2) }} ({{
                    item.ratio * 100
                  }}%)</span
                >
                <span v-else-if="item.type === 'inventory_shrinkage'"
                  >{{ item.name }} (SKU: {{ item.sku || "N/A" }}) qty
                  {{ item.quantity }} ≤ reorder {{ item.reorderLevel }}</span
                >
                <span v-else-if="item.type === 'staff_behavior_score'"
                  >{{ item.actionCount }} actions, score
                  {{ item.score }}/100</span
                >
                <span v-else-if="item.type === 'long_table_duration'"
                  >{{ item.durationHours }}h duration, status
                  {{ item.resStatus }}</span
                >
                <span v-else-if="item.type === 'cash_concentration'"
                  >Cash ratio: {{ item.cashRatio * 100 }}% (
                  {{ item.cashCount }} payments)</span
                >
                <span v-else-if="item.type === 'gift_card_fraud'"
                  >Redeemed {{ item.hoursToRedeem }}h after purchase by
                  {{ item.redeemedBy }} (purchaser:
                  {{ item.purchasedBy }})</span
                >
                <span v-else-if="item.type === 'cross_tenant_fraud_pattern'"
                  >{{ item.anomalyCount }} anomalies detected</span
                >
                <span v-else>—</span>
              </td>
              <td>
                <span v-if="item.amount">GHS {{ item.amount.toFixed(2) }}</span>
                <span v-else-if="item.discountValue"
                  >{{ item.discountValue }}%</span
                >
                <span v-else-if="item.cancellationCount"
                  >{{ item.cancellationCount }}x</span
                >
                <span v-else-if="item.total">GHS {{ item.total }}</span>
                <span v-else-if="item.gap">GHS {{ item.gap.toFixed(2) }}</span>
                <span v-else-if="item.score !== undefined"
                  >{{ item.score }}/100</span
                >
                <span v-else-if="item.durationHours"
                  >{{ item.durationHours }}h</span
                >
                <span v-else-if="item.cashRatio !== undefined"
                  >{{ (item.cashRatio * 100).toFixed(0) }}%</span
                >
                <span v-else-if="item.anomalyCount"
                  >{{ item.anomalyCount }} signals</span
                >
                <span v-else>—</span>
              </td>
              <td>
                <span v-if="item.tenantId">Tenant #{{ item.tenantId }}</span>
                <span v-else-if="item.tenantName">{{ item.tenantName }}</span>
                <span v-else-if="item.customerName">{{
                  item.customerName
                }}</span>
                <span v-else-if="item.customerEmail">{{
                  item.customerEmail
                }}</span>
                <span v-else-if="item.username">{{ item.username }}</span>
                <span v-else-if="item.name">{{ item.name }}</span>
                <span v-else-if="item.code">Gift Card {{ item.code }}</span>
                <span v-else-if="item.reservationId"
                  >Reservation #{{ item.reservationId }}</span
                >
                <span v-else>—</span>
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
const items = ref([]);
const filter = ref("");

const load = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filter.value) params.type = filter.value;
    const res = await adminAPI.getFinancialAnomalies(params);
    items.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const typeClass = (type) => {
  const map = {
    large_refund: "status-failed",
    high_discount: "status-warning",
    frequent_canceller: "status-warning",
    staff_void: "status-failed",
    cash_reconciliation_gap: "status-warning",
    inventory_shrinkage: "status-healthy",
    staff_behavior_score: "status-warning",
    long_table_duration: "status-warning",
    cash_concentration: "status-warning",
    gift_card_fraud: "status-failed",
    cross_tenant_fraud_pattern: "status-warning",
  };
  return map[type] || "status-healthy";
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.fraud-view {
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
.filters {
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
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
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
.status-healthy {
  color: var(--earth-600);
}
.status-warning {
  color: var(--accent-600);
}
.status-failed {
  color: var(--rose-600);
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
