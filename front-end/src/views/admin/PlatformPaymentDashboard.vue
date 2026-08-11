<template>
  <div class="payment-dashboard">
    <div class="page-header">
      <div>
        <h1>Platform Payments</h1>
        <p class="subtitle">
          Paid, unpaid, and pending payments across all tenants
        </p>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Tenants</div>
        <div class="card-value">{{ summary.totalTenants }}</div>
      </div>
      <div class="card">
        <div class="card-label">Active</div>
        <div class="card-value success">{{ summary.active }}</div>
      </div>
      <div class="card">
        <div class="card-label">Inactive</div>
        <div class="card-value muted">{{ summary.inactive }}</div>
      </div>
      <div class="card">
        <div class="card-label">Past Due</div>
        <div class="card-value warning">{{ summary.pastDue }}</div>
      </div>
      <div class="card">
        <div class="card-label">Suspended</div>
        <div class="card-value danger">{{ summary.suspended }}</div>
      </div>
      <div class="card">
        <div class="card-label">Expected Revenue</div>
        <div class="card-value">
          {{ formatCurrency(summary.totalExpected) }}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Collected</div>
        <div class="card-value success">
          {{ formatCurrency(summary.totalCollected) }}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Outstanding</div>
        <div class="card-value danger">
          {{ formatCurrency(summary.totalOutstanding) }}
        </div>
      </div>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search venues..."
        class="search-input"
        @input="onFilterChange"
      />
      <input
        v-model="dateFrom"
        type="date"
        class="filter-input"
        @change="onFilterChange"
      />
      <input
        v-model="dateTo"
        type="date"
        class="filter-input"
        @change="onFilterChange"
      />
      <select
        v-model="filterStatus"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="trialing">Trialing</option>
      </select>
      <select
        v-model="filterPlan"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Plans</option>
        <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
          {{ plan.name }}
        </option>
      </select>
      <button class="reset-btn" @click="resetFilters">Reset</button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading payment data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">Retry</button>
    </div>

    <div v-else class="table-wrapper">
      <table class="payment-table">
        <thead>
          <tr>
            <th>Venue</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Sub. Status</th>
            <th>Unpaid</th>
            <th>Deposit</th>
            <th>Partial</th>
            <th>Paid</th>
            <th>Expected</th>
            <th>Collected</th>
            <th>Outstanding</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in filteredTenants" :key="tenant.id">
            <td>
              <button @click="accessTenant(tenant)" class="link-btn">
                {{ tenant.name }}
              </button>
            </td>
            <td>{{ tenant.plan }}</td>
            <td>
              <span :class="['status-badge', tenant.status]">
                {{ tenant.status }}
              </span>
            </td>
            <td>{{ tenant.subscriptionStatus }}</td>
            <td>{{ tenant.reservationCounts.unpaid || 0 }}</td>
            <td>{{ tenant.reservationCounts.deposit || 0 }}</td>
            <td>{{ tenant.reservationCounts.partial || 0 }}</td>
            <td>{{ tenant.reservationCounts.paid || 0 }}</td>
            <td>{{ formatCurrency(tenant.totalExpected) }}</td>
            <td>{{ formatCurrency(tenant.paymentsCollected) }}</td>
            <td>
              <span
                :class="{
                  outstanding:
                    tenant.totalExpected - tenant.paymentsCollected > 0,
                }"
              >
                {{
                  formatCurrency(
                    tenant.totalExpected - tenant.paymentsCollected
                  )
                }}
              </span>
            </td>
          </tr>
          <tr v-if="!filteredTenants.length">
            <td colspan="11" class="empty-row">
              No tenants match the current filters
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="recentPayments.length" class="recent-section">
      <h2>Recent Payments</h2>
      <div class="table-wrapper">
        <table class="recent-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Venue</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Reservation</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in recentPayments" :key="p.id">
              <td>{{ p.id }}</td>
              <td>
                <button
                  v-if="p.tenant"
                  @click="accessTenant(p.tenant)"
                  class="link-btn"
                >
                  {{ p.tenant.name }}
                </button>
                <span v-else>—</span>
              </td>
              <td>{{ formatCurrency(p.amount) }}</td>
              <td>{{ p.method || "—" }}</td>
              <td>{{ p.reference || "—" }}</td>
              <td>
                <span v-if="p.reservation">
                  #{{ p.reservation.id }}<br />
                  <small class="text-muted"
                    >{{ p.reservation.resDate }}
                    {{ p.reservation.resTime }}</small
                  >
                </span>
                <span v-else>—</span>
              </td>
              <td>{{ formatDate(p.createdAt) }}</td>
              <td>
                <button
                  @click="openPaymentDetail(p)"
                  class="icon-btn"
                  title="View details"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showPaymentModal"
      class="modal-overlay"
      @click.self="closePaymentModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>Payment Details</h3>
          <button @click="closePaymentModal" class="modal-close">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Payment ID</span>
            <span class="detail-value">{{ selectedPayment?.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-value">{{
              formatCurrency(selectedPayment?.amount)
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Method</span>
            <span class="detail-value">{{
              selectedPayment?.method || "—"
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reference</span>
            <span class="detail-value">{{
              selectedPayment?.reference || "—"
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Paid By</span>
            <span class="detail-value">{{
              selectedPayment?.paidBy || "—"
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{
              formatDate(selectedPayment?.createdAt)
            }}</span>
          </div>
          <div class="detail-row" v-if="selectedPayment?.tenant">
            <span class="detail-label">Venue</span>
            <span class="detail-value">
              <button
                @click="
                  accessTenant(selectedPayment.tenant);
                  closePaymentModal();
                "
                class="link-btn"
              >
                {{ selectedPayment.tenant.name }}
              </button>
            </span>
          </div>
          <div class="detail-row" v-if="selectedPayment?.reservation">
            <span class="detail-label">Reservation</span>
            <span class="detail-value">
              #{{ selectedPayment.reservation.id }} —
              {{ selectedPayment.reservation.resDate }}
              {{ selectedPayment.reservation.resTime }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import platformPaymentAPI from "@/services/platformPaymentAPI";
import planAPI from "@/services/planAPI";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const summary = ref({
  totalTenants: 0,
  active: 0,
  inactive: 0,
  pastDue: 0,
  suspended: 0,
  totalExpected: 0,
  totalCollected: 0,
  totalOutstanding: 0,
});
const tenants = ref([]);
const recentPayments = ref([]);
const plans = ref([]);
const searchQuery = ref("");
const filterStatus = ref("");
const filterPlan = ref("");
const dateFrom = ref("");
const dateTo = ref("");
const loading = ref(false);
const error = ref("");
const showPaymentModal = ref(false);
const selectedPayment = ref(null);

let debounceTimer = null;

const filteredTenants = computed(() => {
  return tenants.value.filter((t) => {
    const matchesSearch =
      !searchQuery.value ||
      (t.name &&
        t.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (t.slug &&
        t.slug.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesStatus =
      !filterStatus.value || t.status === filterStatus.value;
    const matchesPlan = !filterPlan.value || t.plan === filterPlan.value;
    return matchesSearch && matchesStatus && matchesPlan;
  });
});

const buildParams = () => ({
  from: dateFrom.value || undefined,
  to: dateTo.value || undefined,
  plan: filterPlan.value || undefined,
  status: filterStatus.value || undefined,
});

const loadData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await platformPaymentAPI.getSummary(buildParams());
    summary.value = response.data.totals || {};
    tenants.value = response.data.tenants || [];
    recentPayments.value = response.data.recentPayments || [];
  } catch (e) {
    error.value = e?.message || "Failed to load payment data";
  } finally {
    loading.value = false;
  }
};

const loadPlans = async () => {
  try {
    const response = await planAPI.listPlans();
    plans.value = response.data.collection || [];
  } catch {
    plans.value = [];
  }
};

const onFilterChange = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadData, 300);
};

const resetFilters = () => {
  searchQuery.value = "";
  filterStatus.value = "";
  filterPlan.value = "";
  dateFrom.value = "";
  dateTo.value = "";
  loadData();
};

const accessTenant = (tenant) => {
  if (tenant && tenant.id) {
    authStore.setTenant(tenant);
    router.push(`/super-admin/tenants/${tenant.id}`);
  }
};

const openPaymentDetail = (payment) => {
  selectedPayment.value = payment;
  showPaymentModal.value = true;
};

const closePaymentModal = () => {
  showPaymentModal.value = false;
  selectedPayment.value = null;
};

const formatCurrency = (val) => {
  if (val == null) return "—";
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadData();
  loadPlans();
});
</script>

<style scoped>
.payment-dashboard {
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
  letter-spacing: var(--tracking-tight);
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
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
  margin-bottom: var(--space-2);
  font-weight: 500;
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.warning {
  color: var(--accent-600);
}
.card-value.danger {
  color: var(--rose-600);
}
.card-value.muted {
  color: var(--ink-muted);
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input,
.filter-input,
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}
.filter-input {
  width: 160px;
}
.filter-select {
  width: 160px;
}
.search-input:focus,
.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.reset-btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-family: var(--font-sans);
}
.reset-btn:hover {
  background: var(--surface-sunken);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-subtle);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
  color: var(--rose-600);
}
.retry-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: white;
  cursor: pointer;
  font-family: var(--font-sans);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-6);
}
.payment-table,
.recent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.payment-table th,
.payment-table td,
.recent-table th,
.recent-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: top;
}
.payment-table th,
.recent-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
  white-space: nowrap;
}
.payment-table tbody tr:hover,
.recent-table tbody tr:hover {
  background: var(--surface-sunken);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.past_due {
  background: var(--accent-100);
  color: var(--accent-600);
}
.status-badge.suspended {
  background: var(--rose-100);
  color: var(--rose-600);
}
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.status-badge.trialing {
  background: var(--sky-100);
  color: var(--sky-600);
}
.outstanding {
  color: var(--rose-600);
  font-weight: 600;
}
.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  text-decoration: underline;
  padding: 0;
}
.link-btn:hover {
  color: var(--accent-600);
}
.icon-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  cursor: pointer;
  color: var(--ink);
  font-family: var(--font-sans);
}
.icon-btn:hover {
  background: var(--surface-sunken);
}
.text-muted {
  color: var(--ink-muted);
  font-size: var(--text-xs);
}
.empty-row {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-6);
}
.recent-section h2 {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-4) 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}
.modal-header h3 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
}
.modal-close {
  background: none;
  border: none;
  font-size: var(--text-2xl);
  line-height: 1;
  cursor: pointer;
  color: var(--ink-muted);
}
.modal-close:hover {
  color: var(--ink);
}
.modal-body {
  padding: var(--space-5);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 500;
}
.detail-value {
  font-size: var(--text-sm);
  color: var(--ink);
  font-weight: 600;
  text-align: right;
}
</style>
