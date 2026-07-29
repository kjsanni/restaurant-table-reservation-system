<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import erpnextAPI from "@/services/erpnextAPI";
import { useTenantBranding } from "@/composables/useTenantBranding";

const router = useRouter();
const authStore = useAuthStore();
const { branding } = useTenantBranding();

const loading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref<"overview" | "invoices" | "payments" | "customers">(
  "overview"
);

const profitLoss = ref<any>(null);
const invoices = ref<any[]>([]);
const payments = ref<any[]>([]);
const customers = ref<any[]>([]);

const tenant = computed(() => authStore.currentTenant);
const isAccountingEnabled = computed(() => {
  const flags = tenant.value?.settings?.featureFlags || {};
  return !!flags.erpnext_accounting;
});

const loadOverview = async () => {
  try {
    const [plRes, invRes, payRes, custRes] = await Promise.all([
      erpnextAPI.getProfitLoss(),
      erpnextAPI.getInvoices(),
      erpnextAPI.getPayments(),
      erpnextAPI.getCustomers(),
    ]);
    profitLoss.value = plRes.data;
    invoices.value = invRes.data?.data || [];
    payments.value = payRes.data?.data || [];
    customers.value = custRes.data?.data || [];
  } catch (err: any) {
    error.value = err.message || "Failed to load ERPNext data";
  } finally {
    loading.value = false;
  }
};

const syncCustomers = async () => {
  try {
    await erpnextAPI.syncCustomers();
    await loadOverview();
  } catch (err: any) {
    error.value = err.message || "Failed to sync customers";
  }
};

const syncInvoices = async () => {
  try {
    await erpnextAPI.syncInvoices();
    await loadOverview();
  } catch (err: any) {
    error.value = err.message || "Failed to sync invoices";
  }
};

const syncPayments = async () => {
  try {
    await erpnextAPI.syncPayments();
    await loadOverview();
  } catch (err: any) {
    error.value = err.message || "Failed to sync payments";
  }
};

onMounted(() => {
  if (!isAccountingEnabled.value) return;
  loadOverview();
});
</script>

<template>
  <div v-if="!isAccountingEnabled" class="erpnext-disabled">
    <p>ERPNext Accounting is not enabled for this tenant.</p>
  </div>

  <div v-else-if="loading" class="erpnext-loading">
    <p>Loading ERPNext accounting data...</p>
  </div>

  <div v-else-if="error" class="erpnext-error">
    <p>{{ error }}</p>
    <button @click="loadOverview">Retry</button>
  </div>

  <div v-else class="erpnext-accounting">
    <h2>Accounting</h2>

    <div class="erpnext-tabs">
      <button
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        Overview
      </button>
      <button
        :class="{ active: activeTab === 'invoices' }"
        @click="activeTab = 'invoices'"
      >
        Invoices
      </button>
      <button
        :class="{ active: activeTab === 'payments' }"
        @click="activeTab = 'payments'"
      >
        Payments
      </button>
      <button
        :class="{ active: activeTab === 'customers' }"
        @click="activeTab = 'customers'"
      >
        Customers
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="erpnext-overview">
      <div v-if="profitLoss" class="erpnext-card">
        <h3>Profit & Loss</h3>
        <pre>{{ JSON.stringify(profitLoss, null, 2) }}</pre>
      </div>

      <div class="erpnext-actions">
        <button @click="syncCustomers">Sync Customers</button>
        <button @click="syncInvoices">Sync Invoices</button>
        <button @click="syncPayments">Sync Payments</button>
      </div>
    </div>

    <div v-if="activeTab === 'invoices'" class="erpnext-invoices">
      <h3>Invoices</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.name">
            <td>{{ inv.customer_name || inv.name }}</td>
            <td>{{ inv.status }}</td>
            <td>{{ inv.grand_total }}</td>
            <td>{{ inv.posting_date }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'payments'" class="erpnext-payments">
      <h3>Payments</h3>
      <table>
        <thead>
          <tr>
            <th>Party</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pay in payments" :key="pay.name">
            <td>{{ pay.party }}</td>
            <td>{{ pay.received_amount }}</td>
            <td>{{ pay.posting_date }}</td>
            <td>{{ pay.reference_no }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'customers'" class="erpnext-customers">
      <h3>Customers</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cust in customers" :key="cust.name">
            <td>{{ cust.customer_name }}</td>
            <td>{{ cust.email_id }}</td>
            <td>{{ cust.mobile_no }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.erpnext-accounting {
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.erpnext-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  border-bottom: 2px solid var(--brand-200);
  padding-bottom: var(--space-sm);
}

.erpnext-tabs button {
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
}

.erpnext-tabs button.active {
  color: var(--brand-600);
  border-bottom-color: var(--brand-600);
}

.erpnext-card {
  background: var(--surface);
  border: 1px solid var(--brand-200);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.erpnext-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.erpnext-actions button {
  padding: var(--space-sm) var(--space-md);
  background: var(--brand-500);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.erpnext-disabled,
.erpnext-loading,
.erpnext-error {
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-secondary);
}

.erpnext-error {
  color: var(--error);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--brand-200);
}

th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
