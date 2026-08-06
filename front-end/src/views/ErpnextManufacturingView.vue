<template>
  <ErpnextBaseView
    title="ERPNext Manufacturing"
    subtitle="BOM categories and production plans"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading manufacturing data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'boms'" class="tab-panel">
        <div class="panel-header">
          <h3>Bills of Material</h3>
          <div class="filters">
            <input
              v-model="bomSearch"
              type="search"
              placeholder="Search BOMs..."
              class="form-input"
            />
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

      <div v-if="activeTab === 'plans'" class="tab-panel">
        <div class="panel-header">
          <h3>Production Plans</h3>
          <div class="filters">
            <select v-model="planStatus" class="form-select">
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
            <button class="btn-secondary" @click="loadProductionPlans">
              Apply
            </button>
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
    error.value =
      e.response?.data?.message || "Failed to load production plans";
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
