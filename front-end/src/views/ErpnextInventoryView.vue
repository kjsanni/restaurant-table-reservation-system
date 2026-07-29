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
const activeTab = ref<"overview" | "items" | "stock" | "warehouses">("overview");

const items = ref<any[]>([]);
const stockEntries = ref<any[]>([]);
const warehouses = ref<any[]>([]);
const lowStockCount = ref(0);

const tenant = computed(() => authStore.currentTenant);
const isStockEnabled = computed(() => {
  const flags = tenant.value?.settings?.featureFlags || {};
  return !!flags.erpnext_stock;
});

const loadOverview = async () => {
  try {
    const [itemsRes, stockRes, whRes] = await Promise.all([
      erpnextAPI.getInventoryItems(),
      erpnextAPI.getStockLedger(),
      erpnextAPI.getWarehouses(),
    ]);
    items.value = itemsRes.data?.data || [];
    stockEntries.value = stockRes.data?.data || [];
    warehouses.value = whRes.data?.data || [];
    lowStockCount.value = items.value.filter(
      (item) => item.opening_qty <= item.reorder_level
    ).length;
  } catch (err: any) {
    error.value = err.message || "Failed to load ERPNext inventory data";
  } finally {
    loading.value = false;
  }
};

const syncItems = async () => {
  try {
    await erpnextAPI.syncInventoryItems();
    await loadOverview();
  } catch (err: any) {
    error.value = err.message || "Failed to sync inventory items";
  }
};

const syncStock = async () => {
  try {
    await erpnextAPI.syncStockEntries();
    await loadOverview();
  } catch (err: any) {
    error.value = err.message || "Failed to sync stock entries";
  }
};

onMounted(() => {
  if (!isStockEnabled.value) return;
  loadOverview();
});
</script>

<template>
  <div v-if="!isStockEnabled" class="erpnext-disabled">
    <p>ERPNext Inventory is not enabled for this tenant.</p>
  </div>

  <div v-else-if="loading" class="erpnext-loading">
    <p>Loading ERPNext inventory data...</p>
  </div>

  <div v-else-if="error" class="erpnext-error">
    <p>{{ error }}</p>
    <button @click="loadOverview">Retry</button>
  </div>

  <div v-else class="erpnext-inventory">
    <h2>Inventory</h2>

    <div class="erpnext-summary-cards">
      <div class="erpnext-card">
        <h3>Total Items</h3>
        <p class="erpnext-stat">{{ items.length }}</p>
      </div>
      <div class="erpnext-card">
        <h3>Low Stock</h3>
        <p class="erpnext-stat erpnext-warning">{{ lowStockCount }}</p>
      </div>
      <div class="erpnext-card">
        <h3>Warehouses</h3>
        <p class="erpnext-stat">{{ warehouses.length }}</p>
      </div>
    </div>

    <div class="erpnext-tabs">
      <button :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
        Overview
      </button>
      <button :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">
        Items
      </button>
      <button :class="{ active: activeTab === 'stock' }" @click="activeTab = 'stock'">
        Stock Ledger
      </button>
      <button :class="{ active: activeTab === 'warehouses' }" @click="activeTab = 'warehouses'">
        Warehouses
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="erpnext-overview">
      <div class="erpnext-actions">
        <button @click="syncItems">Sync Items</button>
        <button @click="syncStock">Sync Stock Entries</button>
      </div>
    </div>

    <div v-if="activeTab === 'items'" class="erpnext-items">
      <h3>Items</h3>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.name">
            <td>{{ item.item_code }}</td>
            <td>{{ item.item_name }}</td>
            <td>{{ item.item_group }}</td>
            <td>{{ item.opening_qty }}</td>
            <td>{{ item.valuation_rate }}</td>
            <td>{{ item.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'stock'" class="erpnext-stock">
      <h3>Stock Ledger</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Warehouse</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in stockEntries" :key="entry.name">
            <td>{{ entry.item_code }}</td>
            <td>{{ entry.qty }}</td>
            <td>{{ entry.warehouse }}</td>
            <td>{{ entry.posting_date }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'warehouses'" class="erpnext-warehouses">
      <h3>Warehouses</h3>
      <ul>
        <li v-for="wh in warehouses" :key="wh.name">
          {{ wh.warehouse_name }} — {{ wh.company }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.erpnext-inventory {
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

.erpnext-warning {
  color: var(--warning);
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

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--brand-200);
}
</style>