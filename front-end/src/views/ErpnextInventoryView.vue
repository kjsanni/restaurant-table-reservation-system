<template>
  <div class="erpnext-view">
    <div class="page-header">
      <h1>ERPNext Inventory</h1>
      <p class="subtitle">Items, stock levels, and warehouses</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading inventory data...</p>
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

      <div v-else-if="activeTab === 'items'" class="tab-panel">
        <div class="panel-header">
          <h3>Items</h3>
          <div class="filters">
            <input
              v-model="itemSearch"
              type="search"
              placeholder="Search items..."
              class="form-input"
            />
            <button class="btn-secondary" @click="loadItems">Search</button>
          </div>
        </div>
        <div v-if="items.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Stock</th>
                <th>Valuation Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.name">
                <td>{{ item.item_code }}</td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.actual_qty ?? item.qty }}</td>
                <td>{{ item.valuation_rate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No items found.</div>
      </div>

      <div v-else-if="activeTab === 'stock'" class="tab-panel">
        <div class="panel-header">
          <h3>Stock Valuation</h3>
          <button class="btn-secondary" @click="loadStockValuation">
            Refresh
          </button>
        </div>
        <div v-if="stockValuation.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Warehouse</th>
                <th>Qty</th>
                <th>Valuation Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stockValuation" :key="row.name">
                <td>{{ row.item_code }}</td>
                <td>{{ row.warehouse }}</td>
                <td>{{ row.actual_qty }}</td>
                <td>{{ row.valuation_rate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No stock valuation data available.</div>
      </div>

      <div v-else-if="activeTab === 'warehouses'" class="tab-panel">
        <div class="panel-header">
          <h3>Warehouses</h3>
        </div>
        <div v-if="warehouses.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wh in warehouses" :key="wh.name">
                <td>{{ wh.name }}</td>
                <td>{{ wh.company }}</td>
                <td>{{ wh.address_line1 || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No warehouses found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import erpnextAPI from "@/services/erpnextAPI";

const loading = ref(true);
const error = ref(null);
const activeTab = ref("items");

const itemSearch = ref("");
const items = ref([]);

const stockValuation = ref([]);

const warehouses = ref([]);

const tabs = [
  { key: "items", label: "Items" },
  { key: "stock", label: "Stock Valuation" },
  { key: "warehouses", label: "Warehouses" },
];

const loadItems = async () => {
  try {
    const params = {};
    if (itemSearch.value) params.search = itemSearch.value;
    const res = await erpnextAPI.getInventoryItems(params);
    items.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load items";
  }
};

const loadStockValuation = async () => {
  try {
    const res = await erpnextAPI.getStockValuation();
    stockValuation.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load stock valuation";
  }
};

const loadWarehouses = async () => {
  try {
    const res = await erpnextAPI.getWarehouses();
    warehouses.value = res.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load warehouses";
  }
};

const loadCurrentTab = async () => {
  error.value = null;
  if (activeTab.value === "items") await loadItems();
  else if (activeTab.value === "stock") await loadStockValuation();
  else if (activeTab.value === "warehouses") await loadWarehouses();
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  await Promise.all([loadItems(), loadStockValuation(), loadWarehouses()]);
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
.form-input {
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
