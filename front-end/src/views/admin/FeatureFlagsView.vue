<template>
  <div class="flags-view">
    <div class="page-header">
      <div>
        <h1>Feature Flags</h1>
        <p class="subtitle">
          Manage platform-wide and per-tenant feature flags
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="loadGlobalFlags">
          {{ globalLoading ? "Refreshing..." : "Refresh Global Flags" }}
        </button>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Global Feature Flags</h3>
        <div v-if="globalLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="globalFlags" class="flags-list">
          <div v-for="(value, key) in globalFlags" :key="key" class="flag-row">
            <span class="flag-key">{{ key }}</span>
            <label class="toggle">
              <input
                type="checkbox"
                :checked="!!value"
                @change="updateGlobalFlag(key, $event.target.checked)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div v-else class="empty-state">No global flags configured</div>
      </div>

      <div class="card">
        <h3>Tenant Feature Flags</h3>
        <div class="filter-row">
          <select v-model="selectedTenantId" class="filter-select">
            <option value="">Select a tenant</option>
            <option
              v-for="tenant in tenants"
              :key="tenant.id"
              :value="tenant.id"
            >
              {{ tenant.name }}
            </option>
          </select>
          <button
            class="btn-primary"
            @click="loadTenantFlags"
            :disabled="!selectedTenantId || tenantLoading"
          >
            {{ tenantLoading ? "Loading..." : "Load Flags" }}
          </button>
        </div>
        <div v-if="tenantFlags" class="flags-list">
          <div v-for="(value, key) in tenantFlags" :key="key" class="flag-row">
            <span class="flag-key">{{ key }}</span>
            <label class="toggle">
              <input
                type="checkbox"
                :checked="!!value"
                @change="updateTenantFlag(key, $event.target.checked)"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const globalFlags = ref(null);
const globalLoading = ref(false);
const tenants = ref([]);
const selectedTenantId = ref("");
const tenantFlags = ref(null);
const tenantLoading = ref(false);

const loadGlobalFlags = async () => {
  globalLoading.value = true;
  try {
    const res = await adminAPI.getGlobalFeatureFlags();
    globalFlags.value = res.data?.flags || {};
  } catch {
    globalFlags.value = null;
  } finally {
    globalLoading.value = false;
  }
};

const updateGlobalFlag = async (key, value) => {
  try {
    const flags = { ...(globalFlags.value || {}), [key]: value };
    await adminAPI.updateGlobalFeatureFlags(flags);
    globalFlags.value = flags;
  } catch {
    loadGlobalFlags();
  }
};

const loadTenants = async () => {
  try {
    const res = await tenantAdminAPI.getAll();
    tenants.value = res.data.collection || res.data || [];
  } catch {
    tenants.value = [];
  }
};

const loadTenantFlags = async () => {
  if (!selectedTenantId.value) return;
  tenantLoading.value = true;
  try {
    const res = await adminAPI.getTenantFeatureFlags(selectedTenantId.value);
    tenantFlags.value = res.data?.featureFlags || {};
  } catch {
    tenantFlags.value = null;
  } finally {
    tenantLoading.value = false;
  }
};

const updateTenantFlag = async (key, value) => {
  if (!selectedTenantId.value) return;
  try {
    const flags = { ...(tenantFlags.value || {}), [key]: value };
    await adminAPI.updateTenantFeatureFlags(selectedTenantId.value, flags);
    tenantFlags.value = flags;
  } catch {
    loadTenantFlags();
  }
};

onMounted(() => {
  loadGlobalFlags();
  loadTenants();
});
</script>

<style scoped>
.flags-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.flags-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.flag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.flag-key {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
}
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--neutral-300);
  transition: 0.3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
.toggle input:checked + .toggle-slider {
  background-color: var(--accent);
}
.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
.filter-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>
