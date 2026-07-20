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
        placeholder="Search tenants..."
        class="search-input"
      />
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="trialing">Trialing</option>
      </select>
      <select v-model="filterPlan" class="filter-select">
        <option value="">All Plans</option>
        <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
          {{ plan.name }}
        </option>
      </select>
    </div>

    <div class="table-wrapper">
      <table class="payment-table">
        <thead>
          <tr>
            <th>Tenant</th>
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
        </tbody>
      </table>
    </div>

    <div class="recent-section" v-if="recentPayments.length">
      <h2>Recent Payments</h2>
      <div class="table-wrapper">
        <table class="recent-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Date</th>
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
              <td>{{ p.method }}</td>
              <td>{{ p.reference || "—" }}</td>
              <td>{{ formatDate(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
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

const loadData = async () => {
  const response = await platformPaymentAPI.getSummary();
  summary.value = response.data.totals || {};
  tenants.value = response.data.tenants || [];
  recentPayments.value = response.data.recentPayments || [];
};

const loadPlans = async () => {
  try {
    const response = await planAPI.listPlans();
    plans.value = response.data.collection || [];
  } catch {
    plans.value = [];
  }
};

const accessTenant = (tenant) => {
  if (tenant && tenant.id) {
    authStore.setTenant(tenant);
    router.push("/reservations");
  }
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
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input,
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
  max-width: 320px;
}
.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
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
}
.payment-table th,
.recent-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
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
.recent-section h2 {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-4) 0;
}
</style>
