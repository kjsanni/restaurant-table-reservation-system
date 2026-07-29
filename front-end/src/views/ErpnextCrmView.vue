<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import erpnextAPI from "@/services/erpnextAPI";
import { useTenantBranding } from "@/composables/useTenantBranding";

const authStore = useAuthStore();
const { branding } = useTenantBranding();

const loading = ref(true);
const error = ref<string | null>(null);
const leads = ref<any[]>([]);
const customers = ref<any[]>([]);

const tenant = computed(() => authStore.currentTenant);
const isCrmEnabled = computed(() => {
  const flags = tenant.value?.settings?.featureFlags || {};
  return !!flags.erpnext_crm;
});

const loadCrm = async () => {
  try {
    const [leadsRes, custRes] = await Promise.all([
      erpnextAPI.getCrmLeads(),
      erpnextAPI.getCrmCustomers(),
    ]);
    leads.value = leadsRes.data?.data || [];
    customers.value = custRes.data?.data || [];
  } catch (err: any) {
    error.value = err.message || "Failed to load CRM data";
  } finally {
    loading.value = false;
  }
};

const syncCrm = async () => {
  try {
    await erpnextAPI.syncCrmLeads();
    await erpnextAPI.syncCrmCustomers();
    await loadCrm();
  } catch (err: any) {
    error.value = err.message || "Failed to sync CRM data";
  }
};

onMounted(() => {
  if (!isCrmEnabled.value) return;
  loadCrm();
});
</script>

<template>
  <div v-if="!isCrmEnabled" class="erpnext-disabled">
    <p>ERPNext CRM is not enabled for this tenant.</p>
  </div>

  <div v-else-if="loading" class="erpnext-loading">
    <p>Loading CRM data...</p>
  </div>

  <div v-else-if="error" class="erpnext-error">
    <p>{{ error }}</p>
    <button @click="loadCrm">Retry</button>
  </div>

  <div v-else class="erpnext-crm">
    <h2>CRM</h2>

    <div class="erpnext-summary-cards">
      <div class="erpnext-card">
        <h3>Leads</h3>
        <p class="erpnext-stat">{{ leads.length }}</p>
      </div>
      <div class="erpnext-card">
        <h3>Customers</h3>
        <p class="erpnext-stat">{{ customers.length }}</p>
      </div>
    </div>

    <div class="erpnext-actions">
      <button @click="syncCrm">Sync CRM</button>
    </div>

    <h3>Leads</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lead in leads" :key="lead.name">
          <td>{{ lead.customer_name }}</td>
          <td>{{ lead.email_id }}</td>
          <td>{{ lead.mobile_no }}</td>
          <td>{{ lead.status }}</td>
        </tr>
      </tbody>
    </table>

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
</template>

<style scoped>
.erpnext-crm {
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.erpnext-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.erpnext-stat {
  font-size: 2rem;
  font-weight: 700;
  color: var(--brand-600);
}

.erpnext-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  margin-bottom: var(--space-lg);
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
  margin-bottom: var(--space-lg);
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
