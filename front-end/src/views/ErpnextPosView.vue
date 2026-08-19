<template>
  <ErpnextBaseView
    title="ERPNext POS"
    subtitle="Point of sale proxy and sync"
    :tabs="tabs"
    v-model:activeTab="activeTab"
    :loading="loading"
    :error="error"
    loading-text="Loading POS data..."
    @retry="loadCurrentTab"
  >
    <template #tab-content="{ activeTab }">
      <div v-if="activeTab === 'proxy'" class="tab-panel">
        <div class="panel-header">
          <h3>POS Proxy</h3>
          <div class="filters">
            <input
              v-model="proxyPath"
              type="text"
              placeholder="/api/resource/Sales Invoice"
              class="form-input"
            />
            <select v-model="proxyMethod" class="form-input">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <button class="btn-primary" @click="runProxy">Send</button>
          </div>
        </div>
        <div v-if="proxyResult" class="result-box">
          <pre>{{ proxyResult }}</pre>
        </div>
      </div>

      <div v-if="activeTab === 'sync'" class="tab-panel">
        <div class="panel-header">
          <h3>Sync</h3>
          <div class="filters">
            <select v-model="syncType" class="form-input">
              <option value="invoice">Invoice</option>
              <option value="payment">Payment</option>
              <option value="item">Item</option>
              <option value="customer">Customer</option>
            </select>
            <button class="btn-primary" @click="runSync">Sync</button>
          </div>
        </div>
        <div v-if="syncResult" class="result-box">
          <pre>{{ syncResult }}</pre>
        </div>
      </div>

      <div v-if="activeTab === 'status'" class="tab-panel">
        <div class="panel-header">
          <h3>Sync Status</h3>
          <button class="btn-secondary" @click="loadSyncStatus">Refresh</button>
        </div>
        <div v-if="syncStatus.length" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in syncStatus" :key="row.name">
                <td>{{ row.name }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.reference_doctype }}: {{ row.reference_name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">No sync status data available.</div>
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
const activeTab = ref("proxy");

const proxyPath = ref("/api/resource/Sales Invoice");
const proxyMethod = ref("GET");
const proxyResult = ref(null);

const syncType = ref("invoice");
const syncResult = ref(null);

const syncStatus = ref([]);

const tabs = [
  { key: "proxy", label: "Proxy" },
  { key: "sync", label: "Sync" },
  { key: "status", label: "Status" },
];

const runProxy = async () => {
  proxyResult.value = null;
  try {
    const res = await erpnextAPI.getPosProxy(
      proxyPath.value,
      proxyMethod.value
    );
    proxyResult.value = JSON.stringify(res.data?.data, null, 2);
  } catch (e) {
    error.value = e.response?.data?.message || "Proxy request failed";
  }
};

const runSync = async () => {
  syncResult.value = null;
  try {
    const res = await erpnextAPI.syncPos(syncType.value, {});
    syncResult.value = JSON.stringify(res.data?.data, null, 2);
  } catch (e) {
    error.value = e.response?.data?.message || "Sync failed";
  }
};

const loadSyncStatus = async () => {
  try {
    const res = await erpnextAPI.getPosSyncStatus();
    syncStatus.value = res.data?.data?.data || [];
  } catch (e) {
    error.value = e.response?.data?.message || "Failed to load sync status";
  }
};

const loadCurrentTab = async () => {
  if (activeTab.value === "status") {
    await loadSyncStatus();
  }
};

onMounted(async () => {
  await loadSyncStatus();
  loading.value = false;
});
</script>

<style scoped>
.result-box {
  margin-top: 16px;
  padding: 12px;
  background: #0d253d;
  color: #e2e8f0;
  border-radius: 8px;
  overflow: auto;
  max-height: 400px;
}
.result-box pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}
</style>
