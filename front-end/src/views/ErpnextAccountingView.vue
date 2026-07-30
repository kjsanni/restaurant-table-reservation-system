<template>
  <ErpnextBaseView
    title="ERPNext Accounting"
    subtitle="Financial reports and transaction history"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading accounting data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'pnl'" class="tab-panel">
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

      <div v-if="activeTab === 'balance-sheet'" class="tab-panel">
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

      <div v-if="activeTab === 'invoices'" class="tab-panel">
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

      <div v-if="activeTab === 'payments'" class="tab-panel">
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
    </template>
  </ErpnextBaseView>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";
import ErpnextBaseView from "@/components/erpnext/ErpnextBaseView.vue";
import "@/components/erpnext/erpnext-view-shared.css";

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
