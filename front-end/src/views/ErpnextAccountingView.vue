<template>
  <div class="erpnext-view">
    <div class="page-header">
      <h1>ERPNext Accounting</h1>
      <p class="subtitle">Financial reports and transaction history</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading accounting data...</p>
    </div>

    <div v-else class="erpnext-content">
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-primary" @click="loadCurrentTab">Retry</button>
      </div>

      <div v-else-if="activeTab === 'pnl'" class="tab-panel">
        <div class="panel-header">
          <h3>Profit & Loss</h3>
          <div class="filters">
            <input v-model="pnlFrom" type="date" class="form-input" />
            <span class="filter-sep">to</span>
            <input v-model="pnlTo" type="date" class="form-input" />
            <button class="btn-secondary" @click="loadPnL">Apply</button>
          </div>
        </div>
        <div v-if="pnlData" class="report-block">
          <pre class="report-json">{{ formatReport(pnlData) }}</pre>
        </div>
        <div v-else class="empty-state">No P&L data available.</div>
      </div>

      <div v-else-if="activeTab === 'balance-sheet'" class="tab-panel">
        <div class="panel-header">
          <h3>Balance Sheet</h3>
          <div class="filters">
            <input v-model="bsFrom" type="date" class="form-input" />
            <span class="filter-sep">to</span>
            <input v-model="bsTo" type="date" class="form-input" />
            <button class="btn-secondary" @click="loadBalanceSheet">
              Apply
            </button>
          </div>
        </div>
        <div v-if="bsData" class="report-block">
          <pre class="report-json">{{ formatReport(bsData) }}</pre>
        </div>
        <div v-else class="empty-state">No balance sheet data available.</div>
      </div>

      <div v-else-if="activeTab === 'invoices'" class="tab-panel">
        <div class="panel-header">
          <h3>Invoices</h3>
          <div class="filters">
            <select v-model="invoiceStatus" class="form-select">
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button class="btn-secondary" @click="loadInvoices">Apply</button>
          </div>
        </div>
        <div v-if="invoices.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.name">
                <td>{{ inv.name }}</td>
                <td>{{ inv.customer_name || inv.customer }}</td>
                <td>{{ inv.status }}</td>
                <td>{{ inv.grand_total }}</td>
                <td>{{ inv.posting_date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No invoices found.</div>
      </div>

      <div v-else-if="activeTab === 'payments'" class="tab-panel">
        <div class="panel-header">
          <h3>Payments</h3>
          <div class="filters">
            <input v-model="paymentFrom" type="date" class="form-input" />
            <span class="filter-sep">to</span>
            <input v-model="paymentTo" type="date" class="form-input" />
            <button class="btn-secondary" @click="loadPayments">Apply</button>
          </div>
        </div>
        <div v-if="payments.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Customer</th>
                <th>Mode</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.name">
                <td>{{ p.name }}</td>
                <td>{{ p.party_name || p.party }}</td>
                <td>{{ p.mode_of_payment }}</td>
                <td>{{ p.paid_amount }}</td>
                <td>{{ p.posting_date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No payments found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";

const loading = ref(true);
const error = ref(null);
const activeTab = ref("pnl");

const pnlFrom = ref("");
const pnlTo = ref("");
const pnlData = ref(null);

const bsFrom = ref("");
const bsTo = ref("");
const bsData = ref(null);

const invoiceStatus = ref("");
const invoices = ref([]);

const paymentFrom = ref("");
const paymentTo = ref("");
const payments = ref([]);

const tabs = [
  { key: "pnl", label: "Profit & Loss" },
  { key: "balance-sheet", label: "Balance Sheet" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
];

const loadPnL = async () => {
  try {
    const params = {};
    if (pnlFrom.value) params.from = pnlFrom.value;
    if (pnlTo.value) params.to = pnlTo.value;
    const res = await erpnextAPI.getProfitLoss(params);
    pnlData.value = res.data?.data || res.data;
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load P&L";
  }
};

const loadBalanceSheet = async () => {
  try {
    const params = {};
    if (bsFrom.value) params.from = bsFrom.value;
    if (bsTo.value) params.to = bsTo.value;
    const res = await erpnextAPI.getBalanceSheet(params);
    bsData.value = res.data?.data || res.data;
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load balance sheet";
  }
};

const loadInvoices = async () => {
  try {
    const params = {};
    if (invoiceStatus.value) params.status = invoiceStatus.value;
    const res = await erpnextAPI.getInvoices(params);
    invoices.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load invoices";
  }
};

const loadPayments = async () => {
  try {
    const params = {};
    if (paymentFrom.value) params.from = paymentFrom.value;
    if (paymentTo.value) params.to = paymentTo.value;
    const res = await erpnextAPI.getPayments(params);
    payments.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load payments";
  }
};

const loadCurrentTab = async () => {
  error.value = null;
  if (activeTab.value === "pnl") await loadPnL();
  else if (activeTab.value === "balance-sheet") await loadBalanceSheet();
  else if (activeTab.value === "invoices") await loadInvoices();
  else if (activeTab.value === "payments") await loadPayments();
};

const formatReport = (data) => {
  if (!data) return "No data";
  return JSON.stringify(data, null, 2);
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  await Promise.all([
    loadPnL(),
    loadBalanceSheet(),
    loadInvoices(),
    loadPayments(),
  ]);
  loading.value = false;
});
</script>

<style scoped>
.erpnext-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1);
}
.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}
.loading-state {
  text-align: center;
  padding: var(--space-8);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.tab-nav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-4);
}
.tab-btn {
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.panel-header h3 {
  margin: 0;
}
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.filter-sep {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.form-input,
.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text);
}
.report-block {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  max-height: 500px;
  overflow: auto;
}
.report-json {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
}
.table-wrapper {
  overflow-x: auto;
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--color-surface-alt);
}
.data-table tbody tr:hover {
  background: var(--color-surface-sunken);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.error-state {
  padding: var(--space-4);
  background: #fef2f2;
  color: #991b1b;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.btn-secondary {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
</style>
