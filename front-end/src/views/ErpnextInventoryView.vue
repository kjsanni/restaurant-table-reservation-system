<template>
  <ErpnextBaseView
    title="ERPNext Inventory"
    subtitle="Items, stock levels, and warehouses"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading inventory data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'items'" class="tab-panel">
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

      <div v-if="activeTab === 'stock'" class="tab-panel">
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

      <div v-if="activeTab === 'warehouses'" class="tab-panel">
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
