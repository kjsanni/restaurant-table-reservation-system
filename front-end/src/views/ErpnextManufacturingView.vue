<template>
  <div class="erpnext-view">
    <div class="page-header">
      <h1>ERPNext Manufacturing</h1>
      <p class="subtitle">BOM categories and production plans</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading manufacturing data...</p>
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

      <div v-else-if="activeTab === 'boms'" class="tab-panel">
        <div class="panel-header">
          <h3>Bills of Material</h3>
          <div class="filters">
            <input v-model="bomSearch" type="search" placeholder="Search BOMs..." class="form-input" />
            <button class="btn-secondary" @click="loadBoms">Search</button>
          </div>
        </div>
        <div v-if="boms.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>UOM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bom in boms" :key="bom.name">
                <td>{{ bom.name }}</td>
                <td>{{ bom.item || bom.item_name }}</td>
                <td>{{ bom.quantity }}</td>
                <td>{{ bom.uom }}</td>
                <td>{{ bom.is_active ? "Active" : "Inactive" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No BOMs found.</div>
      </div>

      <div v-else-if="activeTab === 'plans'" class="tab-panel">
        <div class="panel-header">
          <h3>Production Plans</h3>
          <div class="filters">
            <select v-model="planStatus" class="form-select">
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
            <button class="btn-secondary" @click="loadProductionPlans">Apply</button>
          </div>
        </div>
        <div v-if="productionPlans.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in productionPlans" :key="plan.name">
                <td>{{ plan.name }}</td>
                <td>{{ plan.production_item || plan.item_name }}</td>
                <td>{{ plan.qty }}</td>
                <td>{{ plan.start_date }}</td>
                <td>{{ plan.end_date }}</td>
                <td>{{ plan.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No production plans found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";

const loading = ref(true);
const error = ref(null);
const activeTab = ref("boms");

const bomSearch = ref("");
const boms = ref([]);

const planStatus = ref("");
const productionPlans = ref([]);

const tabs = [
  { key: "boms", label: "BOMs" },
  { key: "plans", label: "Production Plans" },
];

const loadBoms = async () => {
  try {
    const params = {};
    if (bomSearch.value) params.search = bomSearch.value;
    const res = await erpnextAPI.getManufacturingBoms(params);
    boms.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load BOMs";
  }
};

const loadProductionPlans = async () => {
  try {
    const params = {};
    if (planStatus.value) params.status = planStatus.value;
    const res = await erpnextAPI.getManufacturingPlans(params);
    productionPlans.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load production plans";
  }
};

const loadCurrentTab = async () => {
  error.value = null;
  if (activeTab.value === "boms") await loadBoms();
  else if (activeTab.value === "plans") await loadProductionPlans();
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  await Promise.all([loadBoms(), loadProductionPlans()]);
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
.form-input,
.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text);
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
