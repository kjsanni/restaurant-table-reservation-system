<template>
  <div class="erpnext-tenant-modules">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">
        ← Back to ERPNext
      </button>
      <h1>ERPNext Modules: {{ tenantName }}</h1>
      <p class="subtitle">
        Provision and manage ERPNext modules for this tenant
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="content">
      <div class="sync-section">
        <h2>Data Sync</h2>
        <div class="sync-controls">
          <select v-model="syncType" class="form-select">
            <option value="full">Full Sync</option>
            <option value="customers">Customers</option>
            <option value="invoices">Invoices</option>
            <option value="payments">Payments</option>
            <option value="items">Items</option>
            <option value="stock">Stock</option>
            <option value="employees">Employees</option>
            <option value="crm">CRM</option>
          </select>
          <button class="btn-primary" :disabled="syncing" @click="triggerSync">
            {{ syncing ? "Syncing..." : "Sync Now" }}
          </button>
        </div>
        <div v-if="syncMessage" class="sync-message">{{ syncMessage }}</div>
      </div>

      <div class="modules-section">
        <h2>Modules</h2>
        <div class="module-grid">
          <div
            v-for="module in allModules"
            :key="module.flag"
            class="module-card"
            :class="{
              enabled: module.enabled,
              'has-deps': module.dependencies.length > 0,
            }"
          >
            <div class="module-card-header">
              <h3>{{ module.name }}</h3>
              <span class="flag-badge">{{ module.flag }}</span>
            </div>
            <p class="module-description">{{ module.description }}</p>
            <div v-if="module.dependencies.length > 0" class="module-deps">
              Requires:
              <span
                v-for="dep in module.dependencies"
                :key="dep"
                class="dep-chip"
                :class="{ 'dep-met': moduleDepsMet(dep) }"
                >{{ depToName(dep) }}</span
              >
            </div>
            <div v-if="module.onboardingStep" class="onboarding-step">
              Onboarding: {{ module.onboardingStep }}
            </div>
            <div class="module-actions">
              <button
                v-if="!module.enabled"
                class="btn-primary btn-sm"
                :disabled="!canEnable(module) || provisioning"
                @click="toggleModule(module, true)"
              >
                {{ provisioning ? "Provisioning..." : "Enable" }}
              </button>
              <button
                v-else
                class="btn-secondary btn-sm"
                :disabled="provisioning"
                @click="toggleModule(module, false)"
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import adminAPI from "@/services/adminAPI";

const router = useRouter();
const route = useRoute();
const tenantId = route.params.id;

const loading = ref(true);
const error = ref(null);
const tenantName = ref("");
const allModules = ref([]);
const syncType = ref("full");
const syncing = ref(false);
const syncMessage = ref(null);
const provisioning = ref(false);
const provisioningModule = ref(null);

const MODULE_NAMES = {
  erpnext_accounting: "Accounting",
  erpnext_stock: "Inventory",
  erpnext_crm: "CRM",
  erpnext_hr: "HR",
  erpnext_pos: "POS",
  erpnext_manufacturing: "Manufacturing",
};

const depToName = (flag) => MODULE_NAMES[flag] || flag;

const loadTenant = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminAPI.getErpnextTenant(tenantId);
    tenantName.value = res.data?.tenantName || `Tenant #${tenantId}`;

    const metadata = {
      erpnext_accounting: {
        name: "Accounting",
        description: "Invoice, payment, and financial ledger sync",
        dependencies: [],
        onboardingStep: "8A",
      },
      erpnext_stock: {
        name: "Inventory",
        description: "Stock items, warehouses, and stock ledger sync",
        dependencies: [],
        onboardingStep: "8B",
      },
      erpnext_crm: {
        name: "CRM",
        description: "Customer leads and campaign tracking",
        dependencies: [],
        onboardingStep: null,
      },
      erpnext_hr: {
        name: "HR",
        description: "Employee records, attendance, and payroll",
        dependencies: [],
        onboardingStep: "8C",
      },
      erpnext_pos: {
        name: "POS",
        description: "Point of sale integration",
        dependencies: ["erpnext_accounting", "erpnext_stock"],
        onboardingStep: null,
      },
      erpnext_manufacturing: {
        name: "Manufacturing",
        description: "BOM categories and production planning",
        dependencies: ["erpnext_stock"],
        onboardingStep: "8D",
      },
    };

    const featureFlags = res.data?.erpnextModules || [];
    allModules.value = Object.entries(metadata).map(([flag, meta]) => ({
      flag,
      ...meta,
      enabled: featureFlags.includes(flag),
    }));
  } catch (e) {
    error.value = "Failed to load tenant ERPNext settings.";
  } finally {
    loading.value = false;
  }
};

const moduleDepsMet = (depFlag) => {
  const depModule = allModules.value.find((m) => m.flag === depFlag);
  return depModule?.enabled || false;
};

const canEnable = (module) => {
  return module.dependencies.every((dep) => moduleDepsMet(dep));
};

const toggleModule = async (module, enable) => {
  provisioning.value = true;
  provisioningModule.value = module.flag;
  try {
    if (enable) {
      await adminAPI.provisionErpnextModule(tenantId, module.flag);
    } else {
      await adminAPI.deprovisionErpnextModule(tenantId, module.flag);
    }
    module.enabled = enable;
  } catch (e) {
    error.value = `Failed to ${enable ? "provision" : "deprovision"} module.`;
  } finally {
    provisioning.value = false;
    provisioningModule.value = null;
  }
};

const triggerSync = async () => {
  syncing.value = true;
  syncMessage.value = null;
  try {
    await adminAPI.triggerErpnextSync(tenantId, { syncType: syncType.value });
    syncMessage.value = `ERPNext ${syncType.value} sync enqueued successfully.`;
  } catch (e) {
    syncMessage.value = "Failed to trigger sync.";
  } finally {
    syncing.value = false;
  }
};

const goBack = () => {
  router.push("/admin/erpnext");
};

onMounted(() => {
  loadTenant();
});
</script>

<style scoped>
.erpnext-tenant-modules {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header button {
  margin-bottom: var(--space-2);
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

.sync-section {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

.sync-section h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-lg);
}

.sync-controls {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.sync-message {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-success-light, #e6f4ea);
  color: var(--color-success, #1e7e34);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.modules-section h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-lg);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.module-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.module-card.enabled {
  border-color: var(--color-primary);
  background: var(--color-surface-alt, #f8fafc);
}

.module-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.module-card h3 {
  margin: 0;
  font-size: var(--font-size-md);
}

.flag-badge {
  font-size: var(--font-size-xs);
  background: var(--color-surface-alt);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.module-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-2);
}

.module-deps {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.dep-chip {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  margin-left: var(--space-1);
  font-size: var(--font-size-xs);
  background: var(--color-surface);
  border: var(--border-default);
}

.dep-chip.dep-met {
  border-color: var(--color-success);
  color: var(--color-success);
}

.onboarding-step {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.module-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
