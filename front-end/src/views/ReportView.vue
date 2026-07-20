<script setup>
import { ref, onMounted } from "vue";
import reportAPI from "@/services/reportAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import PageHeader from "@/components/PageHeader.vue";

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
    <PageHeader
      title="Reports"
      subtitle="Generate and export reservation reports"
    />
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
        <div class="kpi-strip">
          <div class="kpi-tile">
            <span class="kpi-value">{{ report.totalReservations }}</span>
            <span class="kpi-label">Total Reservations</span>
          </div>
          <div class="kpi-tile">
            <span class="kpi-value kpi-accent">
              GHS {{ report.paymentBreakdown?.totalRevenue?.toFixed(2) }}
            </span>
            <span class="kpi-label">Revenue</span>
          </div>
          <div class="kpi-tile">
            <span class="kpi-value">
              GHS {{ report.paymentBreakdown?.avgPayment?.toFixed(2) }}
            </span>
            <span class="kpi-label">Avg Payment</span>
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
.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
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
  padding: var(--space-20) var(--space-5);
  gap: var(--space-4);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.filters-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
}

.field-label {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.filters-actions {
  margin-top: var(--space-5);
  display: flex;
  justify-content: flex-end;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.kpi-tile {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.kpi-value {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
  line-height: 1;
}

.kpi-label {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.kpi-accent {
  color: var(--accent-600);
}

.export-bar {
  display: flex;
  gap: var(--space-3);
}

.error-state {
  background: var(--rose-50);
  border: 1px solid var(--rose-200, #fecaca);
  border-radius: var(--card-radius);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--rose-600);
  font-family: var(--font-sans);
  font-weight: 300;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.report-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.breakdown-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
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
  padding: var(--space-3-5) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.breakdown-row:last-child {
  border-bottom: none;
}

.breakdown-method {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink);
  text-transform: capitalize;
}

.breakdown-amount {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
}

.breakdown-count {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--neutral-100);
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-sm, 6px);
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-primary {
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--neutral-100);
}

@media screen and (min-width: 640px) {
  .filters-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
