<template>
  <div class="erpnext-admin-view">
    <div class="page-header">
      <div>
        <h1>ERPNext Integration</h1>
        <p class="subtitle">
          Manage ERPNext module provisioning and data sync across tenants
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadTenants">Retry</button>
    </div>

    <div v-else class="erpnext-content">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search tenants..."
          class="form-input search-input"
          @input="handleSearch"
        />
        <select v-model="planFilter" class="form-select" @change="loadTenants">
          <option value="">All plans</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ tenants.length }}</span>
          <span class="stat-label">Total Tenants</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{
            tenants.filter((t) => t.erpnextModules?.length > 0).length
          }}</span>
          <span class="stat-label">ERPNext Enabled</span>
        </div>
      </div>

      <div v-if="syncMessage" class="sync-message">
        {{ syncMessage }}
      </div>

      <div class="tenant-list">
        <div v-for="tenant in tenants" :key="tenant.id" class="tenant-card">
          <div class="tenant-header">
            <h3>{{ tenant.name }}</h3>
            <span class="plan-badge">{{ tenant.plan }}</span>
          </div>
          <div class="tenant-meta">
            <span>{{ tenant.userCount }} user(s)</span>
            <span v-if="tenant.erpnextModules?.length > 0"
              >ERPNext: {{ tenant.erpnextModules.join(", ") }}</span
            >
            <span v-else>No ERPNext modules</span>
          </div>
          <div class="tenant-actions">
            <button
              class="btn-secondary btn-sm"
              @click="viewTenantDetail(tenant.id)"
            >
              Manage Modules
            </button>
            <button
              class="btn-ghost btn-sm"
              :disabled="savingSync"
              @click="triggerSync(tenant.id)"
            >
              {{ savingSync ? "Syncing..." : "Sync Now" }}
            </button>
          </div>
        </div>

        <div v-if="tenants.length === 0" class="empty-state">
          No tenants found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import adminAPI from "@/services/adminAPI";

const router = useRouter();

const loading = ref(true);
const error = ref(null);
const tenants = ref([]);
const searchQuery = ref("");
const planFilter = ref("");
const savingSync = ref(false);
const syncMessage = ref(null);

const triggerSync = async (tenantId) => {
  savingSync.value = true;
  syncMessage.value = null;
  try {
    await adminAPI.triggerErpnextSync(tenantId, { syncType: "full" });
    syncMessage.value = "Sync enqueued successfully.";
  } catch (e) {
    error.value = "Failed to trigger sync.";
  } finally {
    savingSync.value = false;
  }
};

const loadTenants = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (searchQuery.value) params.search = searchQuery.value;
    if (planFilter.value) params.plan = planFilter.value;
    const res = await adminAPI.listErpnextTenants(params);
    tenants.value = res.data?.collection || [];
  } catch (e) {
    error.value = "Failed to load ERPNext tenants.";
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  clearTimeout(handleSearch._timer);
  handleSearch._timer = setTimeout(() => loadTenants(), 300);
};

const viewTenantDetail = (tenantId) => {
  router.push(`/admin/tenants/${tenantId}`);
};

onMounted(() => {
  loadTenants();
});
</script>

<style scoped>
.erpnext-admin-view {
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
.search-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input {
  flex: 1;
  max-width: 400px;
}
.stats-row {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.stat-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
  text-align: center;
}
.stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}
.stat-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
.tenant-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.tenant-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.tenant-header h3 {
  margin: 0 0 var(--space-1);
}
.tenant-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  gap: var(--space-4);
}
.tenant-actions {
  display: flex;
  gap: var(--space-2);
}
.plan-badge {
  background: var(--color-surface-alt);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.saving-indicator {
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.sync-message {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-success-light, #e6f4ea);
  color: var(--color-success, #1e7e34);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
</style>
