<template>
  <div class="integration-view">
    <div class="page-header">
      <div>
        <h1>Integration Analytics</h1>
        <p class="subtitle">
          Monitor Paystack, webhooks, and third-party integrations
        </p>
      </div>
      <button class="btn-primary" @click="loadAll" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh All" }}
      </button>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Third-Party Status</h3>
        <div v-if="thirdPartyLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="thirdPartyStatus" class="status-list">
          <div
            v-for="(item, key) in thirdPartyStatus.integrations"
            :key="key"
            class="status-row"
          >
            <span class="status-name">{{ key }}</span>
            <span class="badge" :class="'badge-' + item.status">{{
              item.status
            }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Webhook Status</h3>
        <div v-if="webhookLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="webhookEvents.length === 0" class="empty-state">
          No webhook events recorded
        </div>
        <div v-else class="event-list">
          <div v-for="evt in webhookEvents" :key="evt.id" class="event-item">
            <b>{{ evt.action }}</b>
            <span>{{ formatDate(evt.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Paystack Transactions</h3>
      <div class="filter-row">
        <input
          v-model="paystackTenantId"
          type="number"
          placeholder="Tenant ID"
          class="filter-select"
        />
        <button
          class="btn-primary"
          @click="loadPaystackTransactions"
          :disabled="paystackLoading"
        >
          {{ paystackLoading ? "Loading..." : "Fetch Transactions" }}
        </button>
      </div>
      <div v-if="paystackLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="paystackTransactions.length === 0" class="empty-state">
        No transactions loaded.
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Channel</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in paystackTransactions" :key="tx.reference">
            <td>{{ tx.reference }}</td>
            <td>{{ formatMoney(tx.amount / 100) }}</td>
            <td>{{ tx.status }}</td>
            <td>{{ tx.channel }}</td>
            <td>{{ formatDate(tx.transaction_date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import formatMoney from "@/utils/formatMoney";

const thirdPartyStatus = ref(null);
const thirdPartyLoading = ref(false);
const webhookEvents = ref([]);
const webhookLoading = ref(false);
const paystackTransactions = ref([]);
const paystackLoading = ref(false);
const paystackTenantId = ref("");
const loading = ref(false);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const loadThirdPartyStatus = async () => {
  thirdPartyLoading.value = true;
  try {
    const res = await adminAPI.getThirdPartyStatus();
    thirdPartyStatus.value = res.data || null;
  } catch {
    thirdPartyStatus.value = null;
  } finally {
    thirdPartyLoading.value = false;
  }
};

const loadWebhookStatus = async () => {
  webhookLoading.value = true;
  try {
    const res = await adminAPI.getWebhookStatus();
    webhookEvents.value = res.data?.collection || [];
  } catch {
    webhookEvents.value = [];
  } finally {
    webhookLoading.value = false;
  }
};

const loadPaystackTransactions = async () => {
  if (!paystackTenantId.value) return;
  paystackLoading.value = true;
  try {
    const res = await adminAPI.getPaystackTransactions(paystackTenantId.value);
    paystackTransactions.value = res.data?.collection || [];
  } catch {
    paystackTransactions.value = [];
  } finally {
    paystackLoading.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadThirdPartyStatus(), loadWebhookStatus()]);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.integration-view {
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
.status-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.status-name {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
  text-transform: capitalize;
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
.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.event-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.event-item b {
  font-size: var(--text-sm);
  color: var(--ink);
}
.event-item span {
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
