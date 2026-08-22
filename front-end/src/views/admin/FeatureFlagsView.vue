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
        <div class="search-row">
          <div class="search-input-wrapper">
            <input
              v-model="globalSearch"
              type="text"
              placeholder="Search flags..."
              class="search-input"
            />
            <button
              v-if="globalSearch"
              @click="globalSearch = ''"
              class="search-input-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          </div>
        </div>
        <div v-if="globalLoading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div
          v-else-if="filteredCategorizedFlags.length"
          class="flags-categorized"
        >
          <div
            v-for="group in filteredCategorizedFlags"
            :key="group.category"
            class="flag-group"
          >
            <div class="flag-group-header">
              <h4 class="flag-group-title">{{ group.category }}</h4>
              <div class="flag-group-actions">
                <button
                  class="btn-sm"
                  @click="bulkGlobalAction(group.category, true)"
                >
                  Enable All
                </button>
                <button
                  class="btn-sm btn-sm-secondary"
                  @click="bulkGlobalAction(group.category, false)"
                >
                  Disable All
                </button>
              </div>
            </div>
            <div class="flags-list">
              <div
                v-for="item in group.flags"
                :key="item.flag"
                class="flag-row"
              >
                <div class="flag-info">
                  <span class="flag-label">{{ item.label || item.flag }}</span>
                  <span v-if="item.description" class="flag-description">{{
                    item.description
                  }}</span>
                  <div
                    v-if="getMissingDependencies(item).length"
                    class="dependency-warning"
                  >
                    Requires:
                    {{
                      getMissingDependencies(item)
                        .map((d) => formatFlagLabel(d))
                        .join(", ")
                    }}
                  </div>
                </div>
                <label class="toggle">
                  <input
                    type="checkbox"
                    :checked="!!globalFlagValues[item.flag]"
                    :disabled="hasBlockingDependency(item)"
                    @change="updateGlobalFlag(item.flag, $event.target.checked)"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          No global flags configured
          <button class="btn-primary" style="margin-top: var(--space-3)">
            Create Flag
          </button>
        </div>
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
          <button
            v-if="selectedTenantId && tenantFlags"
            class="btn-primary btn-warning"
            @click="resetTenantFlags"
            :disabled="resetLoading"
          >
            {{ resetLoading ? "Resetting..." : "Reset to Defaults" }}
          </button>
        </div>

        <div v-if="selectedTenantId && tenantFlags" class="tenant-section">
          <div class="search-row">
            <div class="search-input-wrapper">
              <input
                v-model="tenantSearch"
                type="text"
                placeholder="Search tenant flags..."
                class="search-input"
              />
              <button
                v-if="tenantSearch"
                @click="tenantSearch = ''"
                class="search-input-clear"
                aria-label="Clear search"
              >
                ×
              </button>
            </div>
          </div>

          <div class="preset-row">
            <select v-model="selectedPresetId" class="filter-select">
              <option value="">Apply preset...</option>
              <option
                v-for="preset in presets"
                :key="preset.id"
                :value="preset.id"
              >
                {{ preset.name }}
              </option>
            </select>
            <button
              class="btn-primary"
              @click="applyPreset"
              :disabled="!selectedPresetId || applyPresetLoading"
            >
              {{ applyPresetLoading ? "Applying..." : "Apply Preset" }}
            </button>
            <button
              class="btn-sm btn-sm-secondary"
              @click="showCreatePreset = true"
            >
              New Preset
            </button>
          </div>

          <div v-if="showCreatePreset" class="create-preset-form">
            <input
              v-model="presetName"
              placeholder="Preset name"
              class="search-input"
            />
            <textarea
              v-model="presetDescription"
              placeholder="Description (optional)"
              class="search-input"
            ></textarea>
            <button
              class="btn-primary"
              @click="createPreset"
              :disabled="!presetName || createPresetLoading"
            >
              {{ createPresetLoading ? "Saving..." : "Save Preset" }}
            </button>
            <button
              class="btn-sm btn-sm-secondary"
              @click="showCreatePreset = false"
            >
              Cancel
            </button>
          </div>

          <div v-if="filteredTenantFlags.length" class="flags-list">
            <div
              v-for="item in filteredTenantFlags"
              :key="item.flag"
              class="flag-row"
            >
              <div class="flag-info">
                <span class="flag-label">{{ item.label || item.flag }}</span>
                <span v-if="item.description" class="flag-description">{{
                  item.description
                }}</span>
                <div
                  v-if="getMissingDependencies(item).length"
                  class="dependency-warning"
                >
                  Requires:
                  {{
                    getMissingDependencies(item)
                      .map((d) => formatFlagLabel(d))
                      .join(", ")
                  }}
                </div>
              </div>
              <label class="toggle">
                <input
                  type="checkbox"
                  :checked="!!tenantFlags[item.flag]"
                  :disabled="hasBlockingDependency(item)"
                  @change="updateTenantFlag(item.flag, $event.target.checked)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div v-else class="empty-state">No matching flags</div>

          <div v-if="auditLogs.length" class="audit-section">
            <h4 class="audit-title">Recent Changes</h4>
            <div class="audit-list">
              <div v-for="log in auditLogs" :key="log.id" class="audit-item">
                <span class="audit-flag">{{ log.changes?.flag }}</span>
                <span class="audit-change"
                  >{{ log.changes?.oldValue }} →
                  {{ log.changes?.newValue }}</span
                >
                <span class="audit-time">{{ formatDate(log.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="selectedTenantId && !tenantFlags" class="empty-state">
          Select a tenant and load flags
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, computed, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const globalFlagCatalog = ref([]);
const globalFlagValues = ref({});
const globalLoading = ref(false);
const globalSearch = ref("");
const tenants = ref([]);
const selectedTenantId = ref("");
const tenantFlags = ref(null);
const tenantLoading = ref(false);
const tenantSearch = ref("");
const presets = ref([]);
const selectedPresetId = ref("");
const applyPresetLoading = ref(false);
const showCreatePreset = ref(false);
const presetName = ref("");
const presetDescription = ref("");
const createPresetLoading = ref(false);
const resetLoading = ref(false);
const auditLogs = ref([]);

const categorizedFlags = computed(() => {
  const catalog = globalFlagCatalog.value || [];
  const values = globalFlagValues.value || {};
  const groups = {};

  for (const item of catalog) {
    const category = item.category || "Platform";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  }

  return Object.entries(groups).map(([category, flags]) => ({
    category,
    flags: flags.map((flag) => ({
      ...flag,
      value: values[flag.flag],
    })),
  }));
});

const filteredCategorizedFlags = computed(() => {
  const term = globalSearch.value.trim().toLowerCase();
  if (!term) return categorizedFlags.value;

  return categorizedFlags.value
    .map((group) => ({
      ...group,
      flags: group.flags.filter((flag) => {
        const searchable = [flag.flag, flag.label, flag.description]
          .join(" ")
          .toLowerCase();
        return searchable.includes(term);
      }),
    }))
    .filter((group) => group.flags.length > 0);
});

const tenantFlagItems = computed(() => {
  if (tenantFlags.value === undefined) return [];
  const catalog = globalFlagCatalog.value || [];
  const catalogMap = {};
  for (const item of catalog) {
    catalogMap[item.flag] = item;
  }

  const currentFlags = tenantFlags.value || {};
  return Object.values(catalogMap).map((meta) => {
    return { flag: meta.flag, value: !!currentFlags[meta.flag], ...meta };
  });
});

const filteredTenantFlags = computed(() => {
  const term = tenantSearch.value.trim().toLowerCase();
  if (!term) return tenantFlagItems.value;

  return tenantFlagItems.value.filter((item) => {
    const searchable = [item.flag, item.label, item.description]
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });
});

const getMissingDependencies = (flag) => {
  if (!flag.dependencies || !flag.dependencies.length) return [];
  const currentFlags = {
    ...(globalFlagValues.value || {}),
    ...(tenantFlags.value || {}),
  };
  return flag.dependencies.filter((dep) => !currentFlags[dep]);
};

const hasBlockingDependency = (flag) => {
  return (
    getMissingDependencies(flag).length > 0 &&
    !(
      flag.value ||
      globalFlagValues.value?.[flag.flag] ||
      tenantFlags.value?.[flag.flag]
    )
  );
};

const formatFlagLabel = (flagKey) => {
  const catalog = globalFlagCatalog.value || [];
  const meta = catalog.find((f) => f.flag === flagKey);
  return meta?.label || flagKey;
};

const loadGlobalFlags = async () => {
  globalLoading.value = true;
  try {
    const [catalogRes, valuesRes] = await Promise.all([
      adminAPI.listFeatureFlags(),
      adminAPI.getGlobalFeatureFlags(),
    ]);
    globalFlagCatalog.value = catalogRes.data?.flags || [];
    globalFlagValues.value = valuesRes.data?.flags || {};
  } catch {
    globalFlagCatalog.value = [];
    globalFlagValues.value = {};
  } finally {
    globalLoading.value = false;
  }
};

const updateGlobalFlag = async (key, value) => {
  try {
    const flags = { ...(globalFlagValues.value || {}), [key]: value };
    const res = await adminAPI.updateGlobalFeatureFlags(flags);
    globalFlagValues.value = res.data?.flags || flags;
  } catch {
    loadGlobalFlags();
  }
};

const bulkGlobalAction = async (category, enable) => {
  try {
    const flags = { ...(globalFlagValues.value || {}) };
    const group = categorizedFlags.value.find((g) => g.category === category);
    if (!group) return;
    for (const item of group.flags) {
      flags[item.flag] = enable;
    }
    const res = await adminAPI.updateGlobalFeatureFlags(flags);
    globalFlagValues.value = res.data?.flags || flags;
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
    const [flagsRes, auditRes, presetsRes] = await Promise.all([
      adminAPI.getTenantFeatureFlags(selectedTenantId.value),
      adminAPI.getFlagAuditLog(selectedTenantId.value),
      adminAPI.listFlagPresets(),
    ]);
    tenantFlags.value = flagsRes.data?.featureFlags || {};
    auditLogs.value = auditRes.data?.logs || [];
    presets.value = presetsRes.data?.presets || [];
  } catch {
    tenantFlags.value = null;
    auditLogs.value = [];
    presets.value = [];
  } finally {
    tenantLoading.value = false;
  }
};

const updateTenantFlag = async (key, value) => {
  if (!selectedTenantId.value) return;
  try {
    const flags = { ...(tenantFlags.value || {}), [key]: value };
    const res = await adminAPI.updateTenantFeatureFlags(
      selectedTenantId.value,
      flags
    );
    tenantFlags.value = res.data?.featureFlags || flags;
  } catch {
    loadTenantFlags();
  }
};

const resetTenantFlags = async () => {
  if (!selectedTenantId.value || resetLoading.value) return;
  resetLoading.value = true;
  try {
    const res = await adminAPI.resetTenantFlags(selectedTenantId.value);
    tenantFlags.value = res.data?.featureFlags || {};
  } catch {
    loadTenantFlags();
  } finally {
    resetLoading.value = false;
  }
};

const applyPreset = async () => {
  if (
    !selectedTenantId.value ||
    !selectedPresetId.value ||
    applyPresetLoading.value
  )
    return;
  applyPresetLoading.value = true;
  try {
    const res = await adminAPI.applyFlagPreset(
      selectedTenantId.value,
      selectedPresetId.value
    );
    tenantFlags.value = res.data?.featureFlags || {};
    selectedPresetId.value = "";
  } catch {
    loadTenantFlags();
  } finally {
    applyPresetLoading.value = false;
  }
};

const createPreset = async () => {
  if (!presetName.value || createPresetLoading.value) return;
  createPresetLoading.value = true;
  try {
    await adminAPI.createFlagPreset({
      name: presetName.value,
      description: presetDescription.value,
      featureFlags: tenantFlags.value || {},
      isPublic: true,
    });
    presetName.value = "";
    presetDescription.value = "";
    showCreatePreset.value = false;
    const res = await adminAPI.listFlagPresets();
    presets.value = res.data?.presets || [];
  } catch {
    loadTenantFlags();
  } finally {
    createPresetLoading.value = false;
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
.search-row {
  margin-bottom: var(--space-4);
}
.flags-categorized {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.flag-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.flag-group-title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.flag-group-actions {
  display: flex;
  gap: var(--space-2);
}
.flags-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.flag-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.flag-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}
.flag-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}
.flag-description {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.dependency-warning {
  font-size: var(--text-xs);
  color: var(--warning);
  margin-top: var(--space-1);
}
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  margin-left: var(--space-3);
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
.toggle input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}
.filter-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.preset-row {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  align-items: center;
}
.create-preset-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}

.btn-warning {
  background: linear-gradient(135deg, var(--warning), #d97706);
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-700);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: 600;
}
.btn-sm-secondary {
  background: var(--neutral-200);
  color: var(--ink);
}
.tenant-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.audit-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}
.audit-title {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.audit-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.audit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
}
.audit-flag {
  font-family: var(--font-mono);
  font-weight: 600;
}
.audit-change {
  color: var(--ink-muted);
}
.audit-time {
  color: var(--ink-muted);
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
