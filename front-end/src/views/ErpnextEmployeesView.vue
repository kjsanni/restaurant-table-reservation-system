<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import erpnextAPI from "@/services/erpnextAPI";
import { useTenantBranding } from "@/composables/useTenantBranding";

const authStore = useAuthStore();
const { branding } = useTenantBranding();

const loading = ref(true);
const error = ref<string | null>(null);
const employees = ref<any[]>([]);
const lowStaffCount = ref(0);

const tenant = computed(() => authStore.currentTenant);
const isHrEnabled = computed(() => {
  const flags = tenant.value?.settings?.featureFlags || {};
  return !!flags.erpnext_hr;
});

const loadEmployees = async () => {
  try {
    const result = await erpnextAPI.getHrEmployees();
    employees.value = result.data?.data || [];
    lowStaffCount.value = employees.value.filter(
      (e) => e.status === "Active"
    ).length;
  } catch (err: any) {
    error.value = err.message || "Failed to load HR data";
  } finally {
    loading.value = false;
  }
};

const syncEmployees = async () => {
  try {
    await erpnextAPI.syncEmployees();
    await loadEmployees();
  } catch (err: any) {
    error.value = err.message || "Failed to sync employees";
  }
};

onMounted(() => {
  if (!isHrEnabled.value) return;
  loadEmployees();
});
</script>

<template>
  <div v-if="!isHrEnabled" class="erpnext-disabled">
    <p>ERPNext HR is not enabled for this tenant.</p>
  </div>

  <div v-else-if="loading" class="erpnext-loading">
    <p>Loading HR data...</p>
  </div>

  <div v-else-if="error" class="erpnext-error">
    <p>{{ error }}</p>
    <button @click="loadEmployees">Retry</button>
  </div>

  <div v-else class="erpnext-employees">
    <h2>Staff Records</h2>

    <div class="erpnext-summary-cards">
      <div class="erpnext-card">
        <h3>Total Staff</h3>
        <p class="erpnext-stat">{{ employees.length }}</p>
      </div>
      <div class="erpnext-card">
        <h3>Active</h3>
        <p class="erpnext-stat">{{ lowStaffCount }}</p>
      </div>
    </div>

    <div class="erpnext-actions">
      <button @click="syncEmployees">Sync Staff</button>
    </div>

    <h3>Employees</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="emp in employees" :key="emp.name">
          <td>{{ emp.employee_name }}</td>
          <td>{{ emp.department }}</td>
          <td>{{ emp.designation }}</td>
          <td>{{ emp.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.erpnext-employees {
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