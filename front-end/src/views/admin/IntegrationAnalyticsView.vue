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
          placeholder="Venue ID"
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

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>Paystack Settlements</h3>
        <div class="filter-row">
          <input
            v-model="settlementTenantId"
            type="number"
            placeholder="Venue ID"
            class="filter-select"
          />
          <button
            class="btn-primary"
            @click="loadPaystackSettlements"
            :disabled="settlementLoading"
          >
            {{ settlementLoading ? "Loading..." : "Fetch Settlements" }}
          </button>
        </div>
        <div v-if="settlementLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="paystackSettlements.length === 0" class="empty-state">
          No settlements loaded.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in paystackSettlements" :key="s.id">
              <td>{{ s.id }}</td>
              <td>{{ formatMoney(s.amount / 100) }}</td>
              <td>{{ s.status }}</td>
              <td>{{ formatDate(s.transaction_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Paystack Disputes</h3>
        <div class="filter-row">
          <input
            v-model="disputeTenantId"
            type="number"
            placeholder="Venue ID"
            class="filter-select"
          />
          <button
            class="btn-primary"
            @click="loadPaystackDisputes"
            :disabled="disputeLoading"
          >
            {{ disputeLoading ? "Loading..." : "Fetch Disputes" }}
          </button>
        </div>
        <div v-if="disputeLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="paystackDisputes.length === 0" class="empty-state">
          No disputes loaded.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in paystackDisputes" :key="d.id">
              <td>{{ d.id }}</td>
              <td>{{ formatMoney(d.amount / 100) }}</td>
              <td>{{ d.status }}</td>
              <td>{{ d.currency }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <h3>Paystack Fee Analysis</h3>
      <div class="filter-row">
        <input
          v-model="feeTenantId"
          type="number"
          placeholder="Venue ID"
          class="filter-select"
        />
        <button
          class="btn-primary"
          @click="loadPaystackFeeAnalysis"
          :disabled="feeLoading"
        >
          {{ feeLoading ? "Loading..." : "Analyze Fees" }}
        </button>
      </div>
      <div v-if="feeLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="feeSummary" class="summary-row">
        <div class="summary-item">
          <span class="summary-label">Transactions</span>
          <span class="summary-value">{{ feeSummary.totalTransactions }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Amount</span>
          <span class="summary-value">{{
            formatMoney(feeSummary.totalAmount / 100)
          }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Fees</span>
          <span class="summary-value">{{
            formatMoney(feeSummary.totalFees / 100)
          }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Fee Ratio</span>
          <span class="summary-value">{{ feeSummary.feeRatio }}%</span>
        </div>
      </div>
      <div v-if="feeCollection.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in feeCollection" :key="f.id">
              <td>{{ f.id }}</td>
              <td>{{ formatMoney(f.amount / 100) }}</td>
              <td>{{ formatMoney(f.fee / 100) }}</td>
              <td>{{ formatMoney(f.net / 100) }}</td>
              <td>{{ f.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>Webhook Retries</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadWebhookRetries"
            :disabled="webhookRetryLoading"
          >
            {{ webhookRetryLoading ? "Loading..." : "Fetch Retries" }}
          </button>
        </div>
        <div v-if="webhookRetryLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="webhookRetries.length === 0" class="empty-state">
          No failed webhooks recorded.
        </div>
        <div v-else class="event-list">
          <div v-for="evt in webhookRetries" :key="evt.id" class="event-item">
            <b>{{ evt.action }}</b>
            <span>{{ formatDate(evt.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Integration Latency</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadIntegrationLatency"
            :disabled="latencyLoading"
          >
            {{ latencyLoading ? "Loading..." : "Fetch Latency" }}
          </button>
        </div>
        <div v-if="latencyLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="!integrationLatency" class="empty-state">
          No latency data available.
        </div>
        <div v-else class="status-list">
          <div class="status-row">
            <span class="status-name">Paystack</span>
            <span
              class="badge"
              :class="latencyBadge(integrationLatency.paystack)"
            >
              {{ integrationLatency.paystack }}ms
            </span>
          </div>
          <div class="status-row">
            <span class="status-name">WhatsApp</span>
            <span
              class="badge"
              :class="latencyBadge(integrationLatency.whatsapp)"
            >
              {{ integrationLatency.whatsapp }}ms
            </span>
          </div>
          <div class="status-row">
            <span class="status-name">Shaq Express</span>
            <span
              class="badge"
              :class="latencyBadge(integrationLatency.shaqexpress)"
            >
              {{ integrationLatency.shaqexpress }}ms
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>WhatsApp Analytics</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadWhatsAppAnalytics"
            :disabled="whatsappLoading"
          >
            {{ whatsappLoading ? "Loading..." : "Fetch Analytics" }}
          </button>
        </div>
        <div v-if="whatsappLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="whatsappSummary" class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Campaigns</span>
            <span class="summary-value">{{
              whatsappSummary.totalCampaigns
            }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Sent</span>
            <span class="summary-value">{{ whatsappSummary.totalSent }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Delivered</span>
            <span class="summary-value">{{ whatsappSummary.delivered }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>WhatsApp Campaigns</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadWhatsAppCampaigns"
            :disabled="campaignLoading"
          >
            {{ campaignLoading ? "Loading..." : "Fetch Campaigns" }}
          </button>
        </div>
        <div v-if="campaignLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="whatsappCampaigns.length === 0" class="empty-state">
          No campaigns recorded.
        </div>
        <div v-else class="event-list">
          <div v-for="c in whatsappCampaigns" :key="c.id" class="event-item">
            <b>{{ c.name }}</b>
            <span>{{ c.status }} — {{ formatDate(c.sentAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid" style="margin-top: var(--space-5)">
      <div class="card">
        <h3>Shaq Express Analytics</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadShaqExpressAnalytics"
            :disabled="shaqLoading"
          >
            {{ shaqLoading ? "Loading..." : "Fetch Analytics" }}
          </button>
        </div>
        <div v-if="shaqLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="shaqCollection.length === 0" class="empty-state">
          No delivery data recorded.
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Venue ID</th>
              <th>Total</th>
              <th>Delivered</th>
              <th>Failed</th>
              <th>Avg Attempts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in shaqCollection" :key="row.tenantId">
              <td>{{ row.tenantId }}</td>
              <td>{{ row.totalDeliveries }}</td>
              <td>{{ row.delivered }}</td>
              <td>{{ row.failed }}</td>
              <td>{{ row.avgAttempts }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Unified Integration Event Log</h3>
        <div class="filter-row">
          <button
            class="btn-primary"
            @click="loadUnifiedEvents"
            :disabled="unifiedLoading"
          >
            {{ unifiedLoading ? "Loading..." : "Fetch Events" }}
          </button>
        </div>
        <div v-if="unifiedLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="unifiedEvents.length === 0" class="empty-state">
          No integration events recorded.
        </div>
        <div v-else class="event-list">
          <div v-for="evt in unifiedEvents" :key="evt.id" class="event-item">
            <b>{{ evt.source }}: {{ evt.event }}</b>
            <span>{{ formatDate(evt.createdAt) }}</span>
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

const thirdPartyStatus = ref(null);
const thirdPartyLoading = ref(false);
const webhookEvents = ref([]);
const webhookLoading = ref(false);
const paystackTransactions = ref([]);
const paystackLoading = ref(false);
const paystackTenantId = ref("");
const loading = ref(false);

const paystackSettlements = ref([]);
const settlementLoading = ref(false);
const settlementTenantId = ref("");

const paystackDisputes = ref([]);
const disputeLoading = ref(false);
const disputeTenantId = ref("");

const feeSummary = ref(null);
const feeCollection = ref([]);
const feeLoading = ref(false);
const feeTenantId = ref("");

const webhookRetries = ref([]);
const webhookRetryLoading = ref(false);

const integrationLatency = ref(null);
const latencyLoading = ref(false);

const whatsappSummary = ref(null);
const whatsappLoading = ref(false);

const whatsappCampaigns = ref([]);
const campaignLoading = ref(false);

const shaqCollection = ref([]);
const shaqLoading = ref(false);

const unifiedEvents = ref([]);
const unifiedLoading = ref(false);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const latencyBadge = (value) => {
  if (value === null || value === undefined) return "badge-error";
  if (value < 300) return "badge-healthy";
  if (value < 800) return "badge-configured";
  return "badge-unhealthy";
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

const loadPaystackSettlements = async () => {
  if (!settlementTenantId.value) return;
  settlementLoading.value = true;
  try {
    const res = await adminAPI.getPaystackSettlements(settlementTenantId.value);
    paystackSettlements.value = res.data?.collection || [];
  } catch {
    paystackSettlements.value = [];
  } finally {
    settlementLoading.value = false;
  }
};

const loadPaystackDisputes = async () => {
  if (!disputeTenantId.value) return;
  disputeLoading.value = true;
  try {
    const res = await adminAPI.getPaystackDisputes(disputeTenantId.value);
    paystackDisputes.value = res.data?.collection || [];
  } catch {
    paystackDisputes.value = [];
  } finally {
    disputeLoading.value = false;
  }
};

const loadPaystackFeeAnalysis = async () => {
  if (!feeTenantId.value) return;
  feeLoading.value = true;
  try {
    const res = await adminAPI.getPaystackFeeAnalysis(feeTenantId.value);
    feeSummary.value = res.data?.summary || null;
    feeCollection.value = res.data?.collection || [];
  } catch {
    feeSummary.value = null;
    feeCollection.value = [];
  } finally {
    feeLoading.value = false;
  }
};

const loadWebhookRetries = async () => {
  webhookRetryLoading.value = true;
  try {
    const res = await adminAPI.getWebhookRetries();
    webhookRetries.value = res.data?.collection || [];
  } catch {
    webhookRetries.value = [];
  } finally {
    webhookRetryLoading.value = false;
  }
};

const loadIntegrationLatency = async () => {
  latencyLoading.value = true;
  try {
    const res = await adminAPI.getMonitoringLatency();
    integrationLatency.value = res.data || null;
  } catch {
    integrationLatency.value = null;
  } finally {
    latencyLoading.value = false;
  }
};

const loadWhatsAppAnalytics = async () => {
  whatsappLoading.value = true;
  try {
    const res = await adminAPI.getWhatsAppAnalytics();
    whatsappSummary.value = res.data?.summary || null;
  } catch {
    whatsappSummary.value = null;
  } finally {
    whatsappLoading.value = false;
  }
};

const loadWhatsAppCampaigns = async () => {
  campaignLoading.value = true;
  try {
    const res = await adminAPI.getWhatsAppCampaigns();
    whatsappCampaigns.value = res.data?.collection || [];
  } catch {
    whatsappCampaigns.value = [];
  } finally {
    campaignLoading.value = false;
  }
};

const loadShaqExpressAnalytics = async () => {
  shaqLoading.value = true;
  try {
    const res = await adminAPI.getShaqExpressAnalytics();
    shaqCollection.value = res.data?.collection || [];
  } catch {
    shaqCollection.value = [];
  } finally {
    shaqLoading.value = false;
  }
};

const loadUnifiedEvents = async () => {
  unifiedLoading.value = true;
  try {
    const res = await adminAPI.getUnifiedIntegrationEvents();
    unifiedEvents.value = res.data?.collection || [];
  } catch {
    unifiedEvents.value = [];
  } finally {
    unifiedLoading.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadThirdPartyStatus(),
      loadWebhookStatus(),
      loadWebhookRetries(),
      loadIntegrationLatency(),
      loadWhatsAppAnalytics(),
      loadWhatsAppCampaigns(),
      loadShaqExpressAnalytics(),
      loadUnifiedEvents(),
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
.summary-row {
  display: flex;
  gap: var(--space-5);
  flex-wrap: wrap;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.summary-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.summary-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
}
.table-wrap {
  margin-top: var(--space-4);
}
</style>
