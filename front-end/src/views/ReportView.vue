<script setup>
import { ref, onMounted } from "vue";
import reportAPI from "@/services/reportAPI";
import { getApiErrorMessage } from "@/utils/apiError";

const report = ref(null);
const filters = ref({
  from: "",
  to: "",
  paymentStatus: "",
  resStatus: "",
});
const loading = ref(false);
const generated = ref(false);
const errorMsg = ref("");

const loadReport = async () => {
  loading.value = true;
  errorMsg.value = "";
  generated.value = false;
  try {
    const res = await reportAPI.getReservationReport(filters.value);
    report.value = res.data.report;
    generated.value = true;
  } catch (err) {
    errorMsg.value = getApiErrorMessage(err, "Failed to load report");
  } finally {
    loading.value = false;
  }
};

const exportCSV = async () => {
  const res = await reportAPI.exportCSV(filters.value);
  const blob = new Blob([res.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reservations.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const exportPDF = async () => {
  const res = await reportAPI.exportPDF(filters.value);
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reservations.pdf";
  a.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  loadReport();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Reports &amp; Export</h1>
    </div>
    <div class="content-wrapper">
      <div class="filters-card">
        <h2 class="card-title">Filters</h2>
        <div class="filters-grid">
          <div class="filter-field">
            <label class="field-label">From</label>
            <input type="date" v-model="filters.from" class="field-input" />
          </div>
          <div class="filter-field">
            <label class="field-label">To</label>
            <input type="date" v-model="filters.to" class="field-input" />
          </div>
          <div class="filter-field">
            <label class="field-label">Payment Status</label>
            <select v-model="filters.paymentStatus" class="field-input">
              <option value="">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="deposit">Deposit</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div class="filter-field">
            <label class="field-label">Reservation Status</label>
            <select v-model="filters.resStatus" class="field-input">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="seated">Seated</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="filters-actions">
          <button
            class="btn btn-primary"
            @click="loadReport"
            :disabled="loading"
          >
            {{ loading ? "Generating..." : "Generate Report" }}
          </button>
        </div>
      </div>

      <div class="export-bar">
        <button class="btn btn-secondary" @click="exportCSV">Export CSV</button>
        <button class="btn btn-secondary" @click="exportPDF">
          Export Report
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Generating report...</p>
      </div>
      <div v-else-if="errorMsg" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ errorMsg }}</p>
      </div>
      <div v-else-if="generated && report" class="report-container">
        <div class="report-grid">
          <div class="report-metric">
            <span class="metric-icon">📋</span>
            <div class="metric-content">
              <span class="metric-label">Total Reservations</span>
              <span class="metric-value">{{ report.totalReservations }}</span>
            </div>
          </div>
          <div class="report-metric revenue">
            <span class="metric-icon">💰</span>
            <div class="metric-content">
              <span class="metric-label">Revenue</span>
              <span class="metric-value">
                GHS {{ report.paymentBreakdown?.totalRevenue?.toFixed(2) }}
              </span>
            </div>
          </div>
          <div class="report-metric">
            <span class="metric-icon">💵</span>
            <div class="metric-content">
              <span class="metric-label">Avg Payment</span>
              <span class="metric-value">
                GHS {{ report.paymentBreakdown?.avgPayment?.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <div class="breakdown-card">
          <h2 class="card-title">Payment Breakdown</h2>
          <div
            v-if="report.paymentBreakdown?.byMethod?.length"
            class="breakdown-list"
          >
            <div
              v-for="m in report.paymentBreakdown.byMethod"
              :key="m.method"
              class="breakdown-row"
            >
              <span class="breakdown-method">{{ m.method }}</span>
              <span class="breakdown-amount"
                >GHS {{ m.total?.toFixed(2) }}</span
              >
              <span class="breakdown-count">{{ m.count }}</span>
            </div>
          </div>
          <div v-else class="empty-state">No payment data available</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: 50px;
  margin-bottom: 50px;
  margin-left: var(--x-spacing-mobile);
  margin-right: var(--x-spacing-mobile);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.filters-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
}

.field-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  background: white;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.filters-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.export-bar {
  display: flex;
  gap: 10px;
}

.error-state {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dc2626;
  font-family: "Inter-Light";
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.report-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.report-metric {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.report-metric.revenue {
  border-left: 4px solid #22c55e;
}

.metric-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-family: "Inter-Bold";
  font-size: 24px;
  color: var(--primary-black);
}

.breakdown-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-method {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
  text-transform: capitalize;
}

.breakdown-amount {
  font-family: "Inter-Bold";
  font-size: 15px;
  color: var(--primary-black);
}

.breakdown-count {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.15s;
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

@media screen and (min-width: 640px) {
  .filters-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>
